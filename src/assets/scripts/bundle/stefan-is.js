/**
 * Cycles the "stefan is ___" verb on the homepage.
 * If the Lichess status pill says he's playing, that word goes first.
 */
const WORDS = [
  'planning our next move',
  'running',
  'writing Ruby',
  'playing chess',
  'back in school',
  'debugging something'
];
const HOLD_MS = 2600;
const FADE_MS = 280;

const start = () => {
  const el = document.querySelector('[data-stefan-cycle]');
  if (!el) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const words = () => {
    const playing = document.querySelector('.lichess-status--playing');
    return playing ? ['playing on Lichess', ...WORDS] : WORDS;
  };

  if (reduce.matches) {
    el.textContent = words()[0];
    return;
  }

  let index = 0;
  let timer;

  const paint = list => {
    el.textContent = list[index % list.length];
  };

  const tick = () => {
    const list = words();
    el.classList.add('is-out');
    window.setTimeout(() => {
      index = (index + 1) % list.length;
      paint(list);
      el.classList.remove('is-out');
    }, FADE_MS);
  };

  paint(words());
  timer = window.setInterval(tick, HOLD_MS);

  reduce.addEventListener('change', () => {
    window.clearInterval(timer);
    if (reduce.matches) {
      el.classList.remove('is-out');
      el.textContent = words()[0];
      return;
    }
    timer = window.setInterval(tick, HOLD_MS);
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, {once: true});
} else {
  start();
}
