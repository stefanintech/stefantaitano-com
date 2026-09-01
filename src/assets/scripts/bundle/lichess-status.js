const STATUS_URL = '/.netlify/functions/lichess-status';

const request = fetch(STATUS_URL, {headers: {Accept: 'application/json'}})
  .then(response => (response.ok ? response.json() : null))
  .catch(() => null);

function flag(data, key) {
  return Boolean(data) && Object.hasOwn(data, key) && data[key] === true;
}

function dot() {
  const mark = document.createElement('span');
  mark.className = 'lichess-status__dot';
  mark.setAttribute('aria-hidden', 'true');
  return mark;
}

function renderPlaying(host, data) {
  const gameId = typeof data.gameId === 'string' && data.gameId ? data.gameId : null;
  const link = document.createElement('a');
  link.className = 'lichess-status lichess-status--playing no-indicator';
  link.href = gameId ? `https://lichess.org/${gameId}` : 'https://lichess.org/@/Late2TheBoard';
  link.rel = 'noopener noreferrer';
  const label = typeof data.detail === 'string' && data.detail ? `Playing on Lichess: ${data.detail}` : 'Playing on Lichess';
  link.setAttribute('aria-label', label);
  link.title = label;
  link.append(dot());
  host.replaceWith(link);
}

function renderOnline(host) {
  const mark = document.createElement('span');
  mark.className = 'lichess-status lichess-status--online';
  mark.setAttribute('role', 'img');
  mark.setAttribute('aria-label', 'Online on Lichess');
  mark.title = 'Online on Lichess';
  mark.append(dot());
  host.replaceWith(mark);
}

function apply(data) {
  const host = document.querySelector('[data-lichess-status]');
  if (!host) {
    return;
  }

  if (flag(data, 'playing')) {
    renderPlaying(host, data);
    return;
  }

  if (flag(data, 'online')) {
    renderOnline(host);
  }
}

const paint = () => {
  request.then(apply);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', paint, {once: true});
} else {
  paint();
}
