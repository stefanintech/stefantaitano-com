// © Manuel Matuzović: https://web.dev/website-navigation/ / Web Accessibility Cookbook

const nav = document.querySelector('nav');
const list = nav.querySelector('ul');
const burgerClone = document.querySelector('#burger-template').content.cloneNode(true);
const buttonDrawer = burgerClone.querySelector('button[data-drawer-toggle]');

list.style.setProperty('display', 'flex');

const isOpen = () => buttonDrawer.getAttribute('aria-expanded') === 'true';

buttonDrawer.addEventListener('click', () => {
  buttonDrawer.setAttribute('aria-expanded', String(!isOpen()));
});

const disableMenu = () => {
  buttonDrawer.setAttribute('aria-expanded', 'false');
};

document.addEventListener('keyup', event => {
  if (event.code === 'Escape' && isOpen()) {
    disableMenu();
    buttonDrawer.focus();
  }
});

document.addEventListener('click', event => {
  if (!isOpen()) return;
  if (buttonDrawer.contains(event.target)) return;
  if (event.target.closest('a, [data-submenu-toggle]') && list.contains(event.target)) return;
  disableMenu();
});

// avoid drawer flashing on page load
document.addEventListener('DOMContentLoaded', function () {
  setTimeout(() => {
    list.removeAttribute('data-no-flash');
  }, 100);
});

nav.insertBefore(burgerClone, list);
