/**
 * 2006 (MySpace) and 2005 (Facebook) skins on / and /links/.
 * Type 2006 or 2005. Homepage moon triple-click is 2006 only.
 * Does not listen for "stefan" or the links photo. Escape or [data-era-exit] leaves.
 * If the Lichess dialog is open, Escape closes that first.
 */
const STORAGE_KEY = 'retro-era';
const LEGACY_KEY = 'retro-2006';
const POKE_KEY = 'retro-poke';
const PREFIX = ['2', '0', '0'];
const MOON_CLICKS = 3;
const MOON_WINDOW_MS = 1600;

const root = document.documentElement;

const currentEra = () => {
  const era = root.getAttribute('data-era');
  return era === '2005' || era === '2006' ? era : null;
};

const visibleExit = () => [...document.querySelectorAll('[data-era-exit]')].find(el => !el.closest('[hidden]'));

const apply = (era, {focusExit = false} = {}) => {
  const myspace = document.querySelectorAll('.retro-2006');
  const facebook = document.querySelectorAll('.retro-2005');
  const on = era === '2005' || era === '2006';

  if (on) {
    root.setAttribute('data-era', era);
    sessionStorage.setItem(STORAGE_KEY, era);
    sessionStorage.removeItem(LEGACY_KEY);
  } else {
    root.removeAttribute('data-era');
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(LEGACY_KEY);
  }

  myspace.forEach(panel => {
    panel.hidden = era !== '2006';
  });
  facebook.forEach(panel => {
    panel.hidden = era !== '2005';
  });

  if (focusExit && on) {
    const exit = visibleExit();
    if (exit) exit.focus();
  }
};

const toggle = era => {
  apply(currentEra() === era ? null : era, {focusExit: currentEra() !== era});
};

const restore = () => {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored === '2005' || stored === '2006') {
    apply(stored);
    return;
  }
  if (sessionStorage.getItem(LEGACY_KEY) === '1') apply('2006');
};

const pokeLabel = n => (n === 1 ? 'You poked Stefan.' : `That's ${n} pokes this tab. He has not poked back.`);

const updatePokeStatus = () => {
  const n = Number(sessionStorage.getItem(POKE_KEY) || '0');
  document.querySelectorAll('[data-era-poke-status]').forEach(status => {
    if (n < 1) {
      status.hidden = true;
      status.textContent = '';
      return;
    }
    status.hidden = false;
    status.textContent = pokeLabel(n);
  });
};

const start = () => {
  restore();
  updatePokeStatus();

  let typed = 0;
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && currentEra()) {
      const lichessEgg = document.getElementById('links-egg');
      if (lichessEgg && !lichessEgg.hasAttribute('hidden')) return;
      apply(null);
      return;
    }
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target;
    if (target && (target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName))) {
      return;
    }
    const key = event.key;
    if (typed < 3 && key === PREFIX[typed]) {
      typed += 1;
      return;
    }
    if (typed === 3 && key === '6') {
      typed = 0;
      toggle('2006');
      return;
    }
    if (typed === 3 && key === '5') {
      typed = 0;
      toggle('2005');
      return;
    }
    typed = key === PREFIX[0] ? 1 : 0;
  });

  document.addEventListener('click', event => {
    if (event.target.closest('[data-era-exit]')) {
      event.preventDefault();
      apply(null);
      return;
    }
    if (event.target.closest('[data-era-poke]')) {
      event.preventDefault();
      const n = Number(sessionStorage.getItem(POKE_KEY) || '0') + 1;
      sessionStorage.setItem(POKE_KEY, String(n));
      updatePokeStatus();
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
        toggle('2006');
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
