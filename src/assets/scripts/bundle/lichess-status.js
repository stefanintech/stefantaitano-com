const STATUS_URL = '/.netlify/functions/lichess-status';

function flag(data, key) {
  return Boolean(data) && Object.hasOwn(data, key) && data[key] === true;
}

function dot() {
  const mark = document.createElement('span');
  mark.className = 'lichess-status__dot';
  mark.setAttribute('aria-hidden', 'true');
  return mark;
}

function label(text) {
  const el = document.createElement('span');
  el.className = 'lichess-status__label';
  el.textContent = text;
  return el;
}

function renderPlaying(host, data) {
  const gameId = typeof data.gameId === 'string' && data.gameId ? data.gameId : null;
  const visible = 'Playing on Lichess';
  const full =
    typeof data.detail === 'string' && data.detail ? `${visible}: ${data.detail}` : visible;
  const link = document.createElement('a');
  link.className = 'lichess-status lichess-status--playing no-indicator';
  link.href = gameId ? `https://lichess.org/${gameId}` : 'https://lichess.org/@/Late2TheBoard';
  link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', full);
  link.title = full;
  link.append(dot(), label(visible));
  host.replaceWith(link);
}

function renderOnline(host) {
  const mark = document.createElement('span');
  mark.className = 'lichess-status lichess-status--online';
  mark.title = 'Online on Lichess';
  mark.append(dot(), label('Online on Lichess'));
  host.replaceWith(mark);
}

function apply(host, data) {
  if (flag(data, 'playing')) {
    renderPlaying(host, data);
    return;
  }

  if (flag(data, 'online')) {
    renderOnline(host);
  }
}

function paint() {
  const host = document.querySelector('[data-lichess-status]');
  if (!host) {
    return;
  }

  fetch(STATUS_URL, {headers: {Accept: 'application/json'}})
    .then(response => (response.ok ? response.json() : null))
    .then(data => apply(host, data))
    .catch(() => {});
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', paint, {once: true});
} else {
  paint();
}
