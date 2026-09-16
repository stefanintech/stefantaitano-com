/**
 * 2006 profile skin on the homepage.
 * Keyword buffer is separate from the `stefan` confetti egg.
 * Moon clicks still spawn airplanes; the third quick click also toggles this.
 */
const STORAGE_KEY = 'retro-2006';
const ERA = '2006';
const SEQUENCE = ['2', '0', '0', '6'];
const MOON_GAP_MS = 750;
const MOON_CLICKS = 3;

const html = document.documentElement;

const isOn = () => html.getAttribute('data-era') === ERA;

const applyEra = on => {
  if (on) {
    html.setAttribute('data-era', ERA);
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* private mode */
    }
  } else {
    html.removeAttribute('data-era');
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* private mode */
    }
  }

  document.querySelectorAll('[data-era-chrome], [data-era-exit]').forEach(el => {
    el.hidden = !on;
  });
};

const restore = () => {
  try {
    if (sessionStorage.getItem(STORAGE_KEY)) applyEra(true);
  } catch {
    /* private mode */
  }
};

const isTypingTarget = el => {
  if (!el || el === document.body || el === html) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return Boolean(el.isContentEditable);
};

let seqIndex = 0;

const onKeydown = event => {
  if (event.defaultPrevented) return;
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (isTypingTarget(event.target)) return;

  if (event.key === 'Escape') {
    seqIndex = 0;
    const drawerOpen = document.querySelector('[data-drawer-toggle][aria-expanded="true"]');
    if (drawerOpen) return;
    if (isOn()) applyEra(false);
    return;
  }

  const key = event.key;
  if (key === SEQUENCE[seqIndex]) {
    seqIndex += 1;
    if (seqIndex === SEQUENCE.length) {
      applyEra(true);
      seqIndex = 0;
    }
    return;
  }

  seqIndex = key === SEQUENCE[0] ? 1 : 0;
};

let moonCount = 0;
let moonLast = 0;

const onClick = event => {
  const exit = event.target.closest?.('[data-era-exit]');
  if (exit) {
    applyEra(false);
    return;
  }

  const moon = event.target.closest?.('.pixel-hero__hit--moon');
  if (!moon) return;

  const now = Date.now();
  if (now - moonLast > MOON_GAP_MS) moonCount = 0;
  moonLast = now;
  moonCount += 1;
  if (moonCount >= MOON_CLICKS) {
    moonCount = 0;
    applyEra(!isOn());
  }
};

restore();
document.addEventListener('keydown', onKeydown);
document.addEventListener('click', onClick);
