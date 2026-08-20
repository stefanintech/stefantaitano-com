const LICHESS_URL = 'https://lichess.org/@/Late2TheBoard';
const TOAST_DURATION = 3500;
const LONG_PRESS_MS = 600;

function showToast() {
  let toast = document.querySelector('.links-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'links-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = `Challenge me on Lichess ♟ — <a href="${LICHESS_URL}" rel="me">Late2TheBoard</a>`;
    document.body.appendChild(toast);
  }

  // Force reflow so transition plays even on repeat triggers
  toast.removeAttribute('data-visible');
  void toast.offsetWidth;
  toast.setAttribute('data-visible', '');

  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => {
    toast.removeAttribute('data-visible');
  }, TOAST_DURATION);
}

function init() {
  const avatar = document.getElementById('links-avatar');
  if (!avatar) return;

  // Double-click trigger
  avatar.addEventListener('dblclick', showToast);

  // Long-press trigger (touch + mouse)
  let pressTimer = null;

  function startPress() {
    pressTimer = setTimeout(showToast, LONG_PRESS_MS);
  }

  function cancelPress() {
    clearTimeout(pressTimer);
  }

  avatar.addEventListener('mousedown', startPress);
  avatar.addEventListener('mouseup', cancelPress);
  avatar.addEventListener('mouseleave', cancelPress);
  avatar.addEventListener('touchstart', startPress, {passive: true});
  avatar.addEventListener('touchend', cancelPress);
  avatar.addEventListener('touchcancel', cancelPress);

  // Long-press on touch shouldn't open the browser context menu
  avatar.addEventListener('contextmenu', e => e.preventDefault());

  // Keyboard: Enter or Space on focused avatar
  avatar.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      showToast();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
