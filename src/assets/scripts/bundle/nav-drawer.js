// © Manuel Matuzović: https://web.dev/website-navigation/ / Web Accessibility Cookbook
// Adds the remaining overlay details: Close name, focus trap, restore focus.

const nav = document.querySelector('nav');
const list = nav.querySelector('ul');
const burgerClone = document.querySelector('#burger-template').content.cloneNode(true);
const buttonDrawer = burgerClone.querySelector('button[data-drawer-toggle]');
const inertTargets = document.querySelectorAll('main, .site-footer, header .logo, .skip-link');

list.style.setProperty('display', 'flex');

const isOpen = () => buttonDrawer.getAttribute('aria-expanded') === 'true';

const getFocusable = () =>
  [...nav.querySelectorAll('a[href], button:not([disabled])')].filter(el => el.getClientRects().length > 0);

const setInert = open => {
  inertTargets.forEach(el => {
    if (open) el.setAttribute('inert', '');
    else el.removeAttribute('inert');
  });
};

const setOpen = open => {
  const wasOpen = isOpen();
  buttonDrawer.setAttribute('aria-expanded', String(open));
  setInert(open);

  if (wasOpen && !open && buttonDrawer.getClientRects().length > 0) {
    buttonDrawer.focus();
  }
};

buttonDrawer.addEventListener('click', () => {
  setOpen(!isOpen());
});

const disableMenu = () => {
  setOpen(false);
};

document.addEventListener('keyup', event => {
  if (event.code === 'Escape' && isOpen()) {
    disableMenu();
  }
});

document.addEventListener('keydown', event => {
  if (!isOpen() || event.key !== 'Tab') return;

  const focusable = getFocusable();
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;

  if (event.shiftKey && (active === first || !nav.contains(active))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || !nav.contains(active))) {
    event.preventDefault();
    first.focus();
  }
});

document.addEventListener('click', event => {
  if (!isOpen()) return;
  if (buttonDrawer.contains(event.target)) return;
  if (event.target.closest('a, [data-submenu-toggle]') && list.contains(event.target)) return;
  disableMenu();
});

const navBreakpoint = window.matchMedia('(min-width: {{ designTokens.viewports.navigation }}px)');
navBreakpoint.addEventListener('change', event => {
  if (event.matches && isOpen()) disableMenu();
});

// avoid drawer flashing on page load
document.addEventListener('DOMContentLoaded', function () {
  setTimeout(() => {
    list.removeAttribute('data-no-flash');
  }, 100);
});

nav.insertBefore(burgerClone, list);
