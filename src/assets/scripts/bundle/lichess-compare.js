const LICHESS = 'https://lichess.org';
const CLIENT_ID = 'stefantaitano.com';
const KEYS = {
  verifier: 'lichess-compare:verifier',
  state: 'lichess-compare:state',
  token: 'lichess-compare:token'
};
const CHART = {width: 720, height: 280, pad: {top: 28, right: 16, bottom: 40, left: 52}};
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function redirectUri() {
  return new URL('/chess/', window.location.origin).href;
}

function base64Url(bytes) {
  let binary = '';
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function randomUrl(size) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

async function challengeS256(verifier) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

function hostData() {
  const node = document.getElementById('lichess-compare-data');
  if (!node) {
    return {username: 'Late2TheBoard', rating: null, games: null, points: []};
  }

  try {
    return JSON.parse(node.textContent);
  } catch {
    return {username: 'Late2TheBoard', rating: null, games: null, points: []};
  }
}

function parseRapidHistory(series) {
  if (!Array.isArray(series)) {
    return [];
  }

  const rapid = series.find(entry => entry.name === 'Rapid');
  if (!rapid || !Array.isArray(rapid.points)) {
    return [];
  }

  return rapid.points.map(([year, monthIndex, day, rating]) => {
    const month = monthIndex + 1;
    return {
      year,
      month,
      day,
      date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      rating
    };
  });
}

function todayPoint(rating) {
  const now = new Date();
  return {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
    day: now.getUTCDate(),
    date: now.toISOString().slice(0, 10),
    rating
  };
}

function plotCurves(seriesList) {
  const all = seriesList.flatMap(series => series.points);
  if (!all.length) {
    return null;
  }

  const {width, height, pad} = CHART;
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const ratings = all.map(point => point.rating);
  const yMin = Math.floor((Math.min(...ratings) - 10) / 50) * 50;
  const yMax = Math.ceil((Math.max(...ratings) + 10) / 50) * 50;
  const ySpan = Math.max(yMax - yMin, 1);
  const times = all.map(point => Date.UTC(point.year, point.month - 1, point.day));
  const tMin = Math.min(...times);
  const tMax = Math.max(...times);
  const tSpan = Math.max(tMax - tMin, 1);

  const plot = points =>
    points.map(point => {
      const t = Date.UTC(point.year, point.month - 1, point.day);
      return {
        rating: point.rating,
        date: point.date,
        x: Math.round((pad.left + ((t - tMin) / tSpan) * innerW) * 10) / 10,
        y: Math.round((pad.top + ((yMax - point.rating) / ySpan) * innerH) * 10) / 10
      };
    });

  const chronological = [...all].sort(
    (a, b) => Date.UTC(a.year, a.month - 1, a.day) - Date.UTC(b.year, b.month - 1, b.day)
  );
  const first = chronological[0];
  const last = chronological.at(-1);

  return {
    width,
    height,
    pad,
    yMin,
    yMax,
    firstLabel: `${MONTHS[first.month - 1]} ${first.year}`,
    lastLabel: `${MONTHS[last.month - 1]} ${last.year}`,
    series: seriesList.map(series => {
      const plotted = plot(series.points);
      return {
        ...series,
        plotted,
        last: plotted.at(-1) ?? null,
        polyline: plotted.map(point => `${point.x},${point.y}`).join(' ')
      };
    })
  };
}

function setText(el, name, value) {
  const node = el.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'text');
  node.setAttribute('class', 'chess-chart__axis');
  Object.entries(name).forEach(([key, val]) => node.setAttribute(key, val));
  node.textContent = value;
  el.append(node);
}

function drawOverlay(host, visitor) {
  const svg = document.querySelector('.chess-chart__svg');
  if (!svg) {
    return;
  }

  const figure = svg.closest('figure');
  const samePerson = visitor.username.toLowerCase() === host.username.toLowerCase();
  const hostPoints = Array.isArray(host.points) ? host.points : [];
  const visitorPoints = samePerson ? [] : visitor.points;
  const chart = plotCurves([
    {id: 'host', points: hostPoints},
    {id: 'visitor', points: visitorPoints}
  ].filter(series => series.points.length));

  if (!chart) {
    return;
  }

  const pad = chart.pad;
  svg.replaceChildren();
  svg.setAttribute('viewBox', `0 0 ${chart.width} ${chart.height}`);

  const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
  title.id = 'chess-chart-svg-title';
  title.textContent = 'Rapid rating curves';
  const desc = document.createElementNS('http://www.w3.org/2000/svg', 'desc');
  desc.id = 'chess-chart-svg-desc';
  desc.textContent = samePerson
    ? `${host.username} Rapid rating.`
    : `${host.username} and ${visitor.username} Rapid ratings.`;
  svg.append(title, desc);

  setText(svg, {x: String(pad.left - 8), y: String(pad.top + 4), 'text-anchor': 'end'}, String(chart.yMax));
  setText(
    svg,
    {x: String(pad.left - 8), y: String(chart.height - pad.bottom), 'text-anchor': 'end'},
    String(chart.yMin)
  );

  const base = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  base.setAttribute('class', 'chess-chart__baseline');
  base.setAttribute('x1', String(pad.left));
  base.setAttribute('y1', String(chart.height - pad.bottom));
  base.setAttribute('x2', String(chart.width - pad.right));
  base.setAttribute('y2', String(chart.height - pad.bottom));
  svg.append(base);

  chart.series.forEach(series => {
    const visitorLine = series.id === 'visitor';
    if (series.polyline) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      line.setAttribute('class', visitorLine ? 'chess-chart__line chess-chart__line--visitor' : 'chess-chart__line');
      line.setAttribute('fill', 'none');
      line.setAttribute('points', series.polyline);
      svg.append(line);
    }
    if (series.last) {
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('class', visitorLine ? 'chess-chart__now chess-chart__now--visitor' : 'chess-chart__now');
      dot.setAttribute('cx', String(series.last.x));
      dot.setAttribute('cy', String(series.last.y));
      dot.setAttribute('r', '4');
      svg.append(dot);
    }
  });

  setText(svg, {x: String(pad.left), y: String(chart.height - 12), 'text-anchor': 'start'}, chart.firstLabel);
  setText(
    svg,
    {x: String(chart.width - pad.right), y: String(chart.height - 12), 'text-anchor': 'end'},
    chart.lastLabel
  );

  if (figure) {
    let legend = figure.querySelector('.chess-chart__legend');
    if (!legend) {
      legend = document.createElement('ul');
      legend.className = 'chess-chart__legend';
      figure.insertBefore(legend, figure.querySelector('figcaption'));
    }
    legend.replaceChildren();
    const items = [{name: host.username, visitor: false}];
    if (!samePerson && visitorPoints.length) {
      items.push({name: visitor.username, visitor: true});
    }
    items.forEach(item => {
      const li = document.createElement('li');
      const swatch = document.createElement('span');
      swatch.className = item.visitor ? 'chess-chart__swatch chess-chart__swatch--visitor' : 'chess-chart__swatch';
      swatch.setAttribute('aria-hidden', 'true');
      li.append(swatch, document.createTextNode(item.name));
      legend.append(li);
    });
  }
}

function restoreChart(original) {
  const svg = document.querySelector('.chess-chart__svg');
  if (svg && original) {
    svg.innerHTML = original;
  }
  document.querySelector('.chess-chart__legend')?.remove();
}

function el(name, attrs, text) {
  const node = document.createElement(name);
  Object.entries(attrs || {}).forEach(([key, value]) => node.setAttribute(key, value));
  if (text) {
    node.textContent = text;
  }
  return node;
}

function ratingLine(label, rating, games) {
  const p = el('p');
  const bits = [`${label}:`];
  bits.push(rating == null ? 'no Rapid rating' : `Rapid ${rating}`);
  if (games != null) {
    bits.push(`(${games} game${games === 1 ? '' : 's'})`);
  }
  p.textContent = bits.join(' ');
  return p;
}

function renderLoggedOut(panel, note) {
  panel.replaceChildren();
  if (note) {
    const p = el('p', {class: 'chess-compare__note'});
    p.textContent = note;
    panel.append(p);
  }
  const actions = el('p', {class: 'chess-compare__actions'});
  const button = el('button', {type: 'button', class: 'button', 'data-lichess-compare-login': ''}, 'Log in with Lichess');
  actions.append(button);
  panel.append(actions);
}

function renderConnected(panel, host, visitor, crosstable, preview) {
  panel.replaceChildren();
  if (preview) {
    const note = el('p', {class: 'chess-compare__note'});
    note.textContent = 'Local preview. This is not a real login.';
    panel.append(note);
  }

  panel.append(ratingLine(visitor.username, visitor.rating, visitor.games));
  panel.append(ratingLine(host.username, host.rating, host.games));

  if (visitor.username.toLowerCase() === host.username.toLowerCase()) {
    const same = el('p');
    same.textContent = 'That’s this Lichess account.';
    panel.append(same);
  } else if (crosstable && crosstable.nbGames > 0) {
    const mine = crosstable.users[host.username.toLowerCase()] ?? 0;
    const theirs = crosstable.users[visitor.username.toLowerCase()] ?? 0;
    const games = crosstable.nbGames;
    const p = el('p');
    p.textContent = `Head-to-head: ${visitor.username} ${theirs} – ${mine} ${host.username} (${games} game${games === 1 ? '' : 's'}).`;
    panel.append(p);
  }

  const actions = el('p', {class: 'chess-compare__actions'});
  const button = el(
    'button',
    {type: 'button', class: 'button', 'data-button-variant': 'secondary', 'data-lichess-compare-disconnect': ''},
    'Disconnect'
  );
  actions.append(button);
  panel.append(actions);
}

async function startLogin() {
  const verifier = randomUrl(32);
  const state = randomUrl(16);
  sessionStorage.setItem(KEYS.verifier, verifier);
  sessionStorage.setItem(KEYS.state, state);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: redirectUri(),
    code_challenge_method: 'S256',
    code_challenge: await challengeS256(verifier),
    state
  });

  window.location.assign(`${LICHESS}/oauth?${params}`);
}

function clearAuthParams() {
  const url = new URL(window.location.href);
  if (![...url.searchParams.keys()].some(key => ['code', 'state', 'error', 'error_description', 'compare-preview'].includes(key))) {
    return;
  }
  url.search = '';
  window.history.replaceState({}, '', url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`);
}

async function exchangeCode(code, state) {
  const expected = sessionStorage.getItem(KEYS.state);
  const verifier = sessionStorage.getItem(KEYS.verifier);
  sessionStorage.removeItem(KEYS.state);
  sessionStorage.removeItem(KEYS.verifier);

  if (!expected || state !== expected || !verifier) {
    throw new Error('Login didn’t finish. Try again.');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    code_verifier: verifier,
    redirect_uri: redirectUri(),
    client_id: CLIENT_ID
  });

  const response = await fetch(`${LICHESS}/api/token`, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || 'Lichess didn’t return a token. Try again.');
  }

  sessionStorage.setItem(KEYS.token, data.access_token);
}

async function fetchJson(path, token) {
  const headers = {Accept: 'application/json'};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${LICHESS}${path}`, {headers});
  if (!response.ok) {
    const error = new Error(`${path} ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

async function visitorFromToken(token) {
  const account = await fetchJson('/api/account', token);
  if (account.error) {
    throw new Error(account.error);
  }

  const username = account.username;
  const rapid = account.perfs?.rapid ?? {};
  let points = [];
  try {
    points = parseRapidHistory(await fetchJson(`/api/user/${encodeURIComponent(username)}/rating-history`));
  } catch {
    points = [];
  }
  if (!points.length && typeof rapid.rating === 'number') {
    points = [todayPoint(rapid.rating)];
  }

  return {
    username,
    rating: typeof rapid.rating === 'number' ? rapid.rating : null,
    games: typeof rapid.games === 'number' ? rapid.games : null,
    points
  };
}

async function fetchCrosstable(host, visitor) {
  if (!visitor.username || visitor.username.toLowerCase() === host.username.toLowerCase()) {
    return null;
  }

  try {
    return await fetchJson(
      `/api/crosstable/${encodeURIComponent(host.username)}/${encodeURIComponent(visitor.username)}`
    );
  } catch {
    return null;
  }
}

async function disconnect() {
  const token = sessionStorage.getItem(KEYS.token);
  sessionStorage.removeItem(KEYS.token);
  sessionStorage.removeItem(KEYS.verifier);
  sessionStorage.removeItem(KEYS.state);
  if (!token) {
    return;
  }

  try {
    await fetch(`${LICHESS}/api/token`, {
      method: 'DELETE',
      headers: {Authorization: `Bearer ${token}`}
    });
  } catch {
    // Storage is already cleared.
  }
}

async function previewVisitor(name) {
  const username = name || 'ask17';
  const user = await fetchJson(`/api/user/${encodeURIComponent(username)}`);
  const rapid = user.perfs?.rapid ?? {};
  let points = [];
  try {
    points = parseRapidHistory(await fetchJson(`/api/user/${encodeURIComponent(username)}/rating-history`));
  } catch {
    points = [];
  }
  if (!points.length && typeof rapid.rating === 'number') {
    points = [todayPoint(rapid.rating)];
  }

  return {
    username: user.username ?? username,
    rating: typeof rapid.rating === 'number' ? rapid.rating : null,
    games: typeof rapid.games === 'number' ? rapid.games : null,
    points
  };
}

async function paint() {
  const root = document.querySelector('[data-lichess-compare]');
  const panel = document.querySelector('[data-lichess-compare-panel]');
  if (!root || !panel) {
    return;
  }

  const svg = document.querySelector('.chess-chart__svg');
  window.__lichessCompareSvg = svg ? svg.innerHTML : '';
  panel.setAttribute('aria-live', 'polite');
  root.addEventListener('click', event => {
    if (event.target.closest('[data-lichess-compare-login]')) {
      startLogin().catch(() => {
        renderLoggedOut(panel, 'Could not start login. Try again.');
      });
      return;
    }

    if (event.target.closest('[data-lichess-compare-disconnect]')) {
      disconnect().then(() => {
        restoreChart(window.__lichessCompareSvg);
        renderLoggedOut(panel);
      });
    }
  });

  const host = hostData();
  const params = new URLSearchParams(window.location.search);
  const localPreview = window.location.hostname === 'localhost' && params.has('compare-preview');

  if (params.get('error') === 'access_denied') {
    clearAuthParams();
    renderLoggedOut(panel, 'You didn’t authorize. That’s fine.');
    return;
  }

  if (params.get('error')) {
    const detail = params.get('error_description') || 'Login didn’t finish.';
    clearAuthParams();
    renderLoggedOut(panel, detail);
    return;
  }

  if (params.get('code')) {
    try {
      await exchangeCode(params.get('code'), params.get('state'));
    } catch (error) {
      clearAuthParams();
      renderLoggedOut(panel, error.message);
      return;
    }
    clearAuthParams();
  } else if (!localPreview) {
    const leftover = ['code', 'state', 'error', 'error_description'].some(key => params.has(key));
    if (leftover) {
      clearAuthParams();
    }
  }

  if (localPreview) {
    try {
      const visitor = await previewVisitor(params.get('compare-preview'));
      const crosstable = await fetchCrosstable(host, visitor);
      renderConnected(panel, host, visitor, crosstable, true);
      drawOverlay(host, visitor);
    } catch {
      renderLoggedOut(panel, 'Local preview failed. The public Lichess fetch didn’t come back.');
    }
    return;
  }

  const token = sessionStorage.getItem(KEYS.token);
  if (!token) {
    renderLoggedOut(panel);
    return;
  }

  try {
    const visitor = await visitorFromToken(token);
    const crosstable = await fetchCrosstable(host, visitor);
    renderConnected(panel, host, visitor, crosstable, false);
    drawOverlay(host, visitor);
  } catch (error) {
    if (error.status === 401) {
      sessionStorage.removeItem(KEYS.token);
    }
    renderLoggedOut(panel, 'Could not read your Lichess account. Try logging in again.');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', paint, {once: true});
} else {
  paint();
}
