// Keep the homepage header usable after the pixel sky scrolls away.
// Without JS the header stays absolute and leaves with the sky.

const body = document.body;
const hero = document.querySelector('.pixel-hero');
const header = document.querySelector('body.has-pixel-hero > header');

if (hero && header && body.classList.contains('has-pixel-hero')) {
  body.classList.add('header-follows');

  let observer;

  const headerHeight = () => Math.ceil(header.getBoundingClientRect().height);

  const observe = () => {
    observer?.disconnect();
    observer = new IntersectionObserver(
      ([entry]) => {
        body.classList.toggle('is-header-docked', !entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0,
        rootMargin: `-${headerHeight()}px 0px 0px 0px`
      }
    );
    observer.observe(hero);
  };

  observe();
  window.addEventListener('resize', observe);
}
