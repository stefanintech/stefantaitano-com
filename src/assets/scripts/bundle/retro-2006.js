/**
 * Homepage 2006 skin. Phase 1 only — included from index.njk.
 * Type 2006, or click the pixel moon three times in a short window.
 * Does not listen for "stefan". Escape or [data-era-exit] leaves.
 */
const STORAGE_KEY = 'retro-2006';
const CODE = ['2', '0', '0', '6'];
const MOON_CLICKS = 3;
const MOON_WINDOW_MS = 1600;

const root = document.documentElement;

const isOn = () => root.getAttribute('data-era') === '2006';

const apply = (on, {focusExit = false} = {}) => {
  const panel = document.querySelector('.retro-2006');
  if (on) {
    root.setAttribute('data-era', '2006');
    sessionStorage.setItem(STORAGE_KEY, '1');
    if (panel) panel.hidden = false;
    const exit = document.querySelector('[data-era-exit]');
    if (focusExit && exit) exit.focus();
    return;
  }
  root.removeAttribute('data-era');
  sessionStorage.removeItem(STORAGE_KEY);
  if (panel) panel.hidden = true;
};

const toggle = () => apply(!isOn(), {focusExit: !isOn()});

const start = () => {
  if (sessionStorage.getItem(STORAGE_KEY) === '1') apply(true);

  let typed = 0;
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && isOn()) {
      apply(false);
      return;
    }
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target;
    if (target && (target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName))) {
      return;
    }
    const key = event.key;
    if (key === CODE[typed]) {
      typed += 1;
      if (typed === CODE.length) {
        typed = 0;
        toggle();
      }
      return;
    }
    typed = key === CODE[0] ? 1 : 0;
  });

  document.addEventListener('click', event => {
    if (event.target.closest('[data-era-exit]')) {
      event.preventDefault();
      apply(false);
    }
  });

  let moonCount = 0;
  let moonTimer = 0;
  document.addEventListener(
    'click',
    event => {
      if (!event.target.closest('.pixel-hero__hit--moon')) return;
      window.clearTimeout(moonTimer);
      moonCount += 1;
      if (moonCount >= MOON_CLICKS) {
        moonCount = 0;
        toggle();
        return;
      }
      moonTimer = window.setTimeout(() => {
        moonCount = 0;
      }, MOON_WINDOW_MS);
    },
    true
  );
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, {once: true});
} else {
  start();
}
