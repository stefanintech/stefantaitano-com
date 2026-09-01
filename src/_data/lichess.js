import EleventyFetch from '@11ty/eleventy-fetch';

const USERNAME = 'Late2TheBoard';
const API_ORIGIN = 'https://lichess.org';
const CACHE_DURATION = '6h';
const CACHE_MS = 6 * 60 * 60 * 1000;
const GAMES_MAX = 300;
// Spec minimum for since/until on GET /api/games/user/{username}
const GAMES_TIMESTAMP_MIN = 1356998400070;
const RETRY_WAIT_MS = 60 * 1000;

const emptyPerfs = {
  rapid: {},
  puzzle: {}
};

const emptyCount = {};

// One request at a time, as the Lichess spec requires.
EleventyFetch.concurrency = 1;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function httpStatus(error) {
  const fromCause = error?.cause?.status;
  if (fromCause) {
    return fromCause;
  }

  const match = String(error?.message ?? '').match(/\((\d{3})\)/);
  return match ? Number(match[1]) : undefined;
}

function cacheAlignedUntil(now = Date.now()) {
  return Math.floor(now / CACHE_MS) * CACHE_MS + (CACHE_MS - 1);
}

/**
 * Convert a Lichess rating-history date triple to a calendar date.
 * The month in each point is zero-indexed: January is 0.
 */
function fromLichessHistoryDate(year, monthIndex, day) {
  const month = monthIndex + 1;

  return {
    year,
    month,
    day,
    date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  };
}

function convertRatingHistory(series) {
  if (!Array.isArray(series)) {
    return [];
  }

  return series.map(entry => ({
    name: entry.name,
    points: Array.isArray(entry.points)
      ? entry.points.map(([year, monthIndex, day, rating]) => ({
          ...fromLichessHistoryDate(year, monthIndex, day),
          rating
        }))
      : []
  }));
}

function slimPlayer(player = {}) {
  return {
    name: player.user?.name ?? null,
    id: player.user?.id ?? null,
    rating: player.rating ?? null,
    ratingDiff: player.ratingDiff ?? null,
    provisional: 'provisional' in player ? Boolean(player.provisional) : false
  };
}

function slimGame(game) {
  return {
    id: game.id,
    rated: game.rated,
    variant: game.variant,
    speed: game.speed,
    perf: game.perf,
    createdAt: game.createdAt,
    lastMoveAt: game.lastMoveAt,
    status: game.status,
    winner: 'winner' in game ? game.winner : null,
    players: {
      white: slimPlayer(game.players?.white),
      black: slimPlayer(game.players?.black)
    }
  };
}

function asText(value) {
  if (value == null) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  // @11ty/eleventy-fetch reads type: 'text' cache files with readFileSync,
  // which returns a Buffer on the second build.
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) {
    return value.toString('utf8');
  }

  if (value instanceof Uint8Array) {
    return new TextDecoder('utf-8').decode(value);
  }

  return String(value);
}

function parseNdjson(value) {
  const text = asText(value);
  if (!text.trim()) {
    return [];
  }

  const games = [];

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    let parsed;
    try {
      parsed = JSON.parse(trimmed);
    } catch (error) {
      console.error('[lichess] skipped a games line that was not JSON', error.message);
      continue;
    }

    if (parsed.error && !parsed.id) {
      throw new Error(parsed.error);
    }

    games.push(slimGame(parsed));
  }

  return games;
}

async function fetchLichess(path, {accept = 'application/json', type = 'json'} = {}) {
  const url = `${API_ORIGIN}${path}`;
  const options = {
    duration: CACHE_DURATION,
    type,
    fetchOptions: {
      headers: {
        Accept: accept
      }
    }
  };

  try {
    return await EleventyFetch(url, options);
  } catch (error) {
    if (httpStatus(error) === 429) {
      console.error(`[lichess] 429 on ${path}; waiting 60s before retry`);
      await sleep(RETRY_WAIT_MS);
      return EleventyFetch(url, options);
    }

    throw error;
  }
}

function rapidHistoryPoints(ratingHistory) {
  return ratingHistory.find(series => series.name === 'Rapid')?.points ?? [];
}

function lastFiveRatedRapid(games, userId) {
  const id = userId ?? USERNAME.toLowerCase();
  const out = [];

  for (const game of games) {
    if (!game.rated || game.perf !== 'rapid') {
      continue;
    }

    const meWhite = game.players.white.id === id;
    const meBlack = game.players.black.id === id;
    if (meWhite === meBlack) {
      continue;
    }

    const color = meWhite ? 'white' : 'black';
    const opponent = meWhite ? game.players.black : game.players.white;
    const me = meWhite ? game.players.white : game.players.black;
    let result = 'draw';
    if (game.winner === 'white' || game.winner === 'black') {
      result = game.winner === color ? 'win' : 'loss';
    }

    out.push({
      id: game.id,
      url: `https://lichess.org/${game.id}`,
      createdAt: game.createdAt,
      result,
      resultLabel: result === 'win' ? 'Win' : result === 'loss' ? 'Loss' : 'Draw',
      status: game.status,
      color,
      opponent: opponent.name,
      opponentRating: opponent.rating,
      opponentProvisional: opponent.provisional,
      ratingDiff: me.ratingDiff
    });

    if (out.length === 5) {
      break;
    }
  }

  return out;
}

function buildRapidChart(points) {
  if (!Array.isArray(points) || points.length === 0) {
    return null;
  }

  const width = 720;
  const height = 280;
  const pad = {top: 28, right: 16, bottom: 40, left: 52};
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const ratings = points.map(point => point.rating);
  const minRating = Math.min(...ratings);
  const maxRating = Math.max(...ratings);
  const yMin = Math.floor((minRating - 10) / 50) * 50;
  const yMax = Math.ceil((maxRating + 10) / 50) * 50;
  const ySpan = Math.max(yMax - yMin, 1);
  const times = points.map(point => Date.UTC(point.year, point.month - 1, point.day));
  const tMin = times[0];
  const tMax = times[times.length - 1];
  const tSpan = Math.max(tMax - tMin, 1);

  const plotted = points.map((point, index) => {
    const x = pad.left + ((times[index] - tMin) / tSpan) * innerW;
    const y = pad.top + ((yMax - point.rating) / ySpan) * innerH;
    return {
      date: point.date,
      rating: point.rating,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10
    };
  });

  const last = plotted.at(-1);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const firstPoint = points[0];
  const lastPoint = points.at(-1);

  return {
    width,
    height,
    pad,
    minRating,
    maxRating,
    yMin,
    yMax,
    firstDate: plotted[0].date,
    lastDate: last.date,
    firstLabel: `${monthNames[firstPoint.month - 1]} ${firstPoint.year}`,
    lastLabel: `${monthNames[lastPoint.month - 1]} ${lastPoint.year}`,
    lastDisplay: `${lastPoint.day} ${monthNames[lastPoint.month - 1]} ${lastPoint.year}`,
    polyline: plotted.map(point => `${point.x},${point.y}`).join(' '),
    last
  };
}

function summarizeForLog(data) {
  return {
    username: data.username,
    available: data.available,
    perfs: {
      rapid: data.perfs?.rapid ?? {},
      puzzle: data.perfs?.puzzle ?? {}
    },
    count: data.count,
    ratingHistory: data.ratingHistory.map(series => ({
      name: series.name,
      points: series.points.length,
      last: series.points.at(-1) ?? null
    })),
    recentGames: data.recentGames.map(game => ({
      id: game.id,
      createdAt: game.createdAt,
      status: game.status,
      winner: game.winner
    })),
    lastFiveRatedRapid: data.lastFiveRatedRapid.map(game => ({
      id: game.id,
      result: game.result,
      opponent: game.opponent
    })),
    rapidChart: data.rapidChart
      ? {points: data.rapidChart.polyline.split(' ').length, last: data.rapidChart.last}
      : null,
    errors: data.errors
  };
}

export default async function () {
  const errors = [];
  let user;
  let ratingHistory = [];
  let recentGames = [];

  try {
    user = await fetchLichess(`/api/user/${USERNAME}`);
  } catch (error) {
    const message = `user: ${error.message}`;
    errors.push(message);
    console.error('[lichess]', message);
  }

  try {
    ratingHistory = convertRatingHistory(await fetchLichess(`/api/user/${USERNAME}/rating-history`));
  } catch (error) {
    const message = `rating-history: ${error.message}`;
    errors.push(message);
    console.error('[lichess]', message);
  }

  try {
    const since = Math.max(user?.createdAt ?? GAMES_TIMESTAMP_MIN, GAMES_TIMESTAMP_MIN);
    const until = Math.max(cacheAlignedUntil(), since);
    const query = new URLSearchParams({
      since: String(since),
      until: String(until),
      perfType: 'rapid',
      max: String(GAMES_MAX),
      moves: 'false'
    });
    const ndjson = await fetchLichess(`/api/games/user/${USERNAME}?${query}`, {
      accept: 'application/x-ndjson',
      type: 'text'
    });
    recentGames = parseNdjson(ndjson);
  } catch (error) {
    const status = httpStatus(error);
    const message =
      status === 404
        ? 'games: 404 Not found. If this account’s games are private, Lichess hides the export. Check Display → Share your games on lichess.org, then rebuild.'
        : `games: ${error.message}`;
    errors.push(message);
    console.error('[lichess]', message);
  }

  const rapidPoints = rapidHistoryPoints(ratingHistory);
  const data = {
    ...(user && typeof user === 'object' ? user : {}),
    username: user?.username ?? USERNAME,
    perfs: user?.perfs ?? emptyPerfs,
    count: user?.count ?? emptyCount,
    ratingHistory,
    recentGames,
    lastFiveRatedRapid: lastFiveRatedRapid(recentGames, user?.id),
    rapidChart: buildRapidChart(rapidPoints),
    available: Boolean(user),
    errors
  };

  console.log('[lichess] build data\n' + JSON.stringify(summarizeForLog(data), null, 2));

  return data;
}
