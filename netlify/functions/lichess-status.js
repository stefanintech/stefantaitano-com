const USERNAME = 'Late2TheBoard';
const USER_ID = USERNAME.toLowerCase();
const API_ORIGIN = 'https://lichess.org';
const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=30'
};
const errorHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store'
};

function json(statusCode, body, headers = jsonHeaders) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body)
  };
}

function emptyStatus() {
  return {online: false, playing: false, gameId: null};
}

/**
 * Lichess omits these flags rather than setting them to false.
 * Presence of the key (and a true value) is the signal.
 */
function flagPresent(object, key) {
  return Boolean(object) && Object.hasOwn(object, key) && object[key] === true;
}

function clockLabel(clock) {
  if (!clock || typeof clock.initial !== 'number') {
    return null;
  }

  const minutes = clock.initial / 60;
  const start = Number.isInteger(minutes) ? String(minutes) : String(clock.initial);
  const increment = typeof clock.increment === 'number' ? clock.increment : 0;
  return `${start}+${increment}`;
}

function detailFromGame(game) {
  if (!game || game.status !== 'started' || !game.players) {
    return null;
  }

  const white = game.players.white;
  const black = game.players.black;
  const meIsWhite = white?.user?.id === USER_ID;
  const meIsBlack = black?.user?.id === USER_ID;
  if (meIsWhite === meIsBlack) {
    return null;
  }

  const opponent = meIsWhite ? black : white;
  const name = opponent?.user?.name;
  const rating = opponent?.rating;
  const clock = clockLabel(game.clock);
  if (!name && !clock) {
    return null;
  }

  const ratingBit = typeof rating === 'number' ? ` (${rating})` : '';
  const vs = name ? `vs ${name}${ratingBit}` : null;
  if (clock && vs) {
    return `${clock} ${vs}`;
  }
  return clock || vs;
}

export function fromStatusPayload(list) {
  const user = Array.isArray(list) ? list.find(entry => entry?.id === USER_ID) : null;
  if (!user) {
    return emptyStatus();
  }

  const playing = flagPresent(user, 'playing');
  const online = flagPresent(user, 'online') || playing;
  const gameId = playing && typeof user.playingId === 'string' && user.playingId ? user.playingId : null;

  return {online, playing, gameId};
}

async function enrichPlaying(status) {
  if (!status.playing) {
    return status;
  }

  try {
    const query = new URLSearchParams({moves: 'false'});
    const response = await fetch(`${API_ORIGIN}/api/user/${USERNAME}/current-game?${query}`, {
      headers: {Accept: 'application/json'}
    });
    if (!response.ok) {
      return status;
    }

    const game = await response.json();
    if (!game || game.status !== 'started') {
      return status;
    }
    if (status.gameId && game.id && game.id !== status.gameId) {
      return status;
    }

    const detail = detailFromGame(game);
    return {
      ...status,
      gameId: status.gameId || (typeof game.id === 'string' ? game.id : null),
      ...(detail ? {detail} : {})
    };
  } catch {
    return status;
  }
}

export async function handler() {
  try {
    const response = await fetch(`${API_ORIGIN}/api/users/status?ids=${USERNAME}&withGameIds=true`, {
      headers: {Accept: 'application/json'}
    });
    if (!response.ok) {
      return json(502, emptyStatus(), errorHeaders);
    }

    const status = await enrichPlaying(fromStatusPayload(await response.json()));
    return json(200, status);
  } catch {
    return json(502, emptyStatus(), errorHeaders);
  }
}
