// Short copy that changes often. Templates read these keys; edit the strings here, not in the templates.
// An empty string (or empty list) leaves its element out of the page.
import {author} from './meta.js';

export default {
  // Home intro, above the link line and the stream. Approved; paste replacements verbatim.
  intro:
    "Hey, I'm Stefan. I'm a veteran and a software developer who builds the behind-the-scenes systems that help apps talk to each other, and I'm back in school. Right now I'm writing Ruby, running, playing chess, and planning our family's next move. Below is everything I've been up to, newest first: posts, places I've been, and quick updates on what I'm doing now.",

  // Home link line under the intro, in order.
  linkLine: [
    {label: 'Résumé', url: '/resume/'},
    {label: 'Projects', url: '/projects/'},
    {label: 'GitHub', url: 'https://github.com/stefanintech'},
    {label: 'Email', url: `mailto:${author.email}`}
  ],
  // Visible muted prefix before the link line. Hidden from screen readers; linkLineLabel says it instead.
  linkLinePrefix: 'Hiring?',
  // Screen-reader name for the link line.
  linkLineLabel:
    'Hiring? Résumé, projects, GitHub, and email',

  // <meta name="description"> and og/twitter description for /.
  homeDescription:
    "I'm Stefan, a veteran and software developer. Posts, places I've been, and what I'm up to now.",

  // Optional line under the /checkins/ heading.
  checkinsIntro:
    "Places I've been, turned into little clay scenes. Each one goes up a day after I've left.",

  // Caption under the /checkins/ map.
  checkinsMapCaption:
    "Dots mark the middle of each city, never the exact spot. A small town I've only been to once shows up at the nearest big city. You can browse them by city below.",

  // Link at the end of each /now card on the home stream.
  nowMore:
    "More of what I'm up to"
};
