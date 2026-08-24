const LONG_PRESS_MS = 550;
const KEYWORD = 'stefan';
const CONFETTI_Z = 200;
const COLORS = ['#b45309', '#fbbe25', '#fbf8f3', '#64748b'];

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const inertTargets = () => document.querySelectorAll('header, main, footer');

function celebrate(confetti) {
  if (prefersReducedMotion()) return;

  const pawn = confetti.shapeFromText({text: '♟', scalar: 4});

  confetti({
    particleCount: 90,
    spread: 80,
    startVelocity: 45,
    origin: {y: 0.7},
    colors: COLORS,
    zIndex: CONFETTI_Z
  });

  confetti({
    shapes: [pawn],
    scalar: 4,
    particleCount: 28,
    spread: 100,
    startVelocity: 32,
    origin: {y: 0.55},
    zIndex: CONFETTI_Z
  });

  const end = Date.now() + 1200;
  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: {x: 0, y: 0.7},
      colors: COLORS,
      zIndex: CONFETTI_Z
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: {x: 1, y: 0.7},
      colors: COLORS,
      zIndex: CONFETTI_Z
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

function init() {
  const avatar = document.getElementById('links-avatar');
  const egg = document.getElementById('links-egg');
  if (!avatar || !egg) return;

  const card = egg.querySelector('.links-egg__card');
  const closeButtons = egg.querySelectorAll('[data-close]');
  const boardLink = egg.querySelector('a[rel="me"]');
  const chrome = inertTargets();
  let pressTimer = null;
  let lastFocus = null;
  let keywordIndex = 0;

  const isOpen = () => !egg.hasAttribute('hidden');

  const getFocusable = () =>
    [...card.querySelectorAll('a[href], button:not([disabled])')].filter(el => !el.hasAttribute('tabindex') || el.tabIndex >= 0);

  const openEgg = () => {
    if (isOpen()) return;
    lastFocus = document.activeElement;
    egg.removeAttribute('hidden');
    chrome.forEach(el => el.setAttribute('inert', ''));
    (boardLink || getFocusable()[0])?.focus();
    import('canvas-confetti').then(({default: confetti}) => {
      celebrate(confetti);
      document.querySelectorAll('canvas').forEach(canvas => {
        canvas.style.pointerEvents = 'none';
      });
    });
  };

  const closeEgg = () => {
    if (!isOpen()) return;
    egg.setAttribute('hidden', '');
    chrome.forEach(el => el.removeAttribute('inert'));
    (lastFocus || avatar).focus();
  };

  const startPress = () => {
    avatar.setAttribute('data-holding', '');
    pressTimer = setTimeout(() => {
      avatar.removeAttribute('data-holding');
      openEgg();
    }, LONG_PRESS_MS);
  };

  const cancelPress = () => {
    avatar.removeAttribute('data-holding');
    clearTimeout(pressTimer);
  };

  avatar.addEventListener('mousedown', startPress);
  avatar.addEventListener('mouseup', cancelPress);
  avatar.addEventListener('mouseleave', cancelPress);
  avatar.addEventListener('touchstart', startPress, {passive: true});
  avatar.addEventListener('touchend', cancelPress);
  avatar.addEventListener('touchcancel', cancelPress);
  avatar.addEventListener('dblclick', event => {
    event.preventDefault();
    openEgg();
  });
  avatar.addEventListener('contextmenu', event => event.preventDefault());
  avatar.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openEgg();
    }
  });

  closeButtons.forEach(button => button.addEventListener('click', closeEgg));

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && isOpen()) {
      event.preventDefault();
      closeEgg();
      return;
    }

    if (isOpen() && event.key === 'Tab') {
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }

    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key.length !== 1) return;
    const key = event.key.toLowerCase();
    if (key === KEYWORD[keywordIndex]) {
      keywordIndex += 1;
      if (keywordIndex === KEYWORD.length) {
        keywordIndex = 0;
        openEgg();
      }
    } else {
      keywordIndex = key === KEYWORD[0] ? 1 : 0;
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
