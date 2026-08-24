const LONG_PRESS_MS = 500;
// iOS often steals an image long-press a little before our timer fires.
const STOLEN_PRESS_MS = 400;
const MOVE_CANCEL_PX = 28;
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
  const chrome = inertTargets();
  let pressTimer = null;
  let pressPointerId = null;
  let pressStartedAt = 0;
  let pressStartX = 0;
  let pressStartY = 0;
  let lastFocus = null;
  let savedScrollY = 0;
  let keywordIndex = 0;

  document.body.append(egg);

  const isOpen = () => !egg.hasAttribute('hidden');

  const getFocusable = () =>
    [...card.querySelectorAll('a[href], button:not([disabled])')].filter(el => !el.hasAttribute('tabindex') || el.tabIndex >= 0);

  const openEgg = () => {
    if (isOpen()) return;
    lastFocus = document.activeElement;
    savedScrollY = window.scrollY;
    egg.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    chrome.forEach(el => el.setAttribute('inert', ''));
    // Do not focus the Lichess link: iOS scrolls the page to it and shows
    // the Safari toolbar / footer instead of the overlay.
    card.focus({preventScroll: true});
    window.scrollTo(0, savedScrollY);
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
    document.body.style.overflow = '';
    chrome.forEach(el => el.removeAttribute('inert'));
    (lastFocus || avatar).focus({preventScroll: true});
    window.scrollTo(0, savedScrollY);
  };

  const clearPress = () => {
    avatar.removeAttribute('data-holding');
    clearTimeout(pressTimer);
    pressTimer = null;
    pressPointerId = null;
  };

  const startPress = event => {
    if (!event.isPrimary) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (pressPointerId !== null) return;

    // Non-passive: stop iOS from turning this into Save Image / a callout.
    event.preventDefault();

    pressPointerId = event.pointerId;
    pressStartedAt = Date.now();
    pressStartX = event.clientX;
    pressStartY = event.clientY;
    avatar.setAttribute('data-holding', '');

    try {
      avatar.setPointerCapture(event.pointerId);
    } catch {
      // Capture is best-effort; the timer still runs without it.
    }

    pressTimer = setTimeout(() => {
      pressTimer = null;
      pressPointerId = null;
      avatar.removeAttribute('data-holding');
      openEgg();
    }, LONG_PRESS_MS);
  };

  const endPress = event => {
    if (pressPointerId === null) return;
    if (event.pointerId !== pressPointerId) return;

    const held = pressStartedAt ? Date.now() - pressStartedAt : 0;
    const stolenByBrowser = event.type === 'pointercancel';
    clearPress();

    // Safari iOS fires pointercancel instead of contextmenu when it claims
    // an image long-press. If they already held, that is the easter egg.
    if (stolenByBrowser && held >= STOLEN_PRESS_MS) {
      openEgg();
    }
  };

  const onPointerMove = event => {
    if (pressPointerId === null || event.pointerId !== pressPointerId) return;
    const dx = event.clientX - pressStartX;
    const dy = event.clientY - pressStartY;
    if (dx * dx + dy * dy > MOVE_CANCEL_PX * MOVE_CANCEL_PX) {
      clearPress();
    }
  };

  avatar.addEventListener('pointerdown', startPress, {passive: false});
  avatar.addEventListener('pointerup', endPress);
  avatar.addEventListener('pointercancel', endPress);
  avatar.addEventListener('pointermove', onPointerMove);
  // iOS still uses touch for the image callout. preventDefault here is what
  // actually keeps the hold from being cancelled around 500ms. Also start the
  // timer from touch in case pointerdown is suppressed.
  avatar.addEventListener(
    'touchstart',
    event => {
      event.preventDefault();
      const touch = event.changedTouches[0];
      if (!touch) return;
      startPress({
        isPrimary: true,
        pointerType: 'touch',
        button: 0,
        pointerId: touch.identifier,
        clientX: touch.clientX,
        clientY: touch.clientY,
        preventDefault() {}
      });
    },
    {passive: false}
  );
  avatar.addEventListener('touchend', () => {
    if (pressPointerId !== null) endPress({pointerId: pressPointerId, type: 'pointerup'});
  });
  avatar.addEventListener('touchcancel', () => {
    if (pressPointerId !== null) endPress({pointerId: pressPointerId, type: 'pointercancel'});
  });
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
