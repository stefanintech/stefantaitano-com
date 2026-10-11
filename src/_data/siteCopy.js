// Short copy that changes often. Templates read these keys; edit the strings here, not in the templates.
// An empty string (or empty list) leaves its element out of the page.
import {author} from './meta.js';

export default {
  // Home intro, above the link line and the stream. Approved; paste replacements verbatim.
  intro:
    "Hey, I'm Stefan. I'm a veteran who builds backend systems and integrations, currently in the ServiceNow world, and I'm back in school. Right now I'm writing Ruby, running, playing chess, and planning our family's next move. This is where my posts, check-ins, and /now updates end up, newest first.",

  // Home link line under the intro, in order. Labels are placeholders until the copy lands.
  linkLine: [
    {label: 'Résumé', url: '/resume/'},
    {label: 'Projects', url: '/projects/'},
    {label: 'GitHub', url: 'https://github.com/stefanintech'},
    {label: 'Email', url: `mailto:${author.email}`}
  ],
  // Screen-reader name for the link line.
  linkLineLabel: 'Elsewhere',

  // <meta name="description"> and og/twitter description for /.
  homeDescription:
    'Veteran and ServiceNow developer in Minneapolis. I build systems for a living and escape plans for fun.',

  // Optional line under the /checkins/ heading.
  checkinsIntro: 'Somewhere I was. Never somewhere I am.',

  // Caption under the /checkins/ map.
  checkinsMapCaption:
    "Dots mark the middle of each city, never the exact spot. A small town I've only been to once shows up at the nearest big city. Every city is in the list below.",

  // Link at the end of each /now card on the home stream.
  nowMore: 'More on /now'
};
