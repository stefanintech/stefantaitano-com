/**
 * Rewrites `<time data-ago datetime="YYYY-MM-DD">` to "N days ago" for check-ins
 * 1–60 days old, counted in the visitor's local calendar days. Anything else
 * keeps the date rendered at build time.
 */
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAYS = 60;
const relative = new Intl.RelativeTimeFormat('en', {numeric: 'always'});

const today = new Date();
today.setHours(0, 0, 0, 0);

document.querySelectorAll('time[data-ago]').forEach(el => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(el.getAttribute('datetime') ?? '');
  if (!match) return;

  const visit = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const days = Math.round((today - visit) / DAY_MS);
  if (days < 1 || days > MAX_DAYS) return;

  el.textContent = relative.format(-days, 'day');
});
