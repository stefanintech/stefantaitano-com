export const url = process.env.URL || 'https://www.stefantaitano.com';
// Extract domain from `url`
export const domain = new URL(url).hostname;
export const siteName = 'Stefan Taitano';
export const siteDescription =
  'Army veteran turned ServiceNow consultant, documenting the path to CTA certification, backend development, and relocating a family of four to Thailand.';
export const siteType = 'Person'; // schema
export const locale = 'en_EN';
export const lang = 'en';
export const skipContent = 'Skip to content';
export const author = {
  name: 'Stefan Taitano', // i.e. Lene Saile - page / blog author's name. Must be set.
  avatar: '/icon-512x512.png', // path to the author's avatar. In this case just using a favicon.
  email: 'hello@stefantaitano.com', // i.e. hola@lenesaile.com - email of the author
  website: 'https://www.stefantaitano.com', // i.e. https.://www.lenesaile.com - the personal site of the author
  // fediverse: '@lene@front-end.social' // used for highlighting journalism on the fediverse. Can be Mastodon, Flipboard, Threads, WordPress (with the ActivityPub plugin installed), PeerTube, Pixelfed, etc. https://blog.joinmastodon.org/2024/07/highlighting-journalism-on-mastodon/
};
export const creator = {
  name: 'Stefan Taitano', // i.e. Lene Saile - creator's (developer) name.
  email: 'hello@stefantaitano.com',
  website: 'https://www.stefantaitano.com',
  // social: 'https://front-end.social/@lene'
};
export const pathToSvgLogo = 'src/assets/svg/misc/logo.svg'; // used for favicon generation
export const themeColor = '#B45309'; // used in manifest, for example primary color value
export const themeLight = '#F7F4EF'; // used for meta tag theme-color, if light colors are prefered. best use value set for light bg
export const themeDark = '#1E2530'; // used for meta tag theme-color, if dark colors are prefered. best use value set for dark bg
export const opengraph_default = '/assets/og-images/default-preview.svg'; // fallback/default meta image
export const opengraph_default_alt =
  'Default social preview card for Stefan Taitano.'; // alt text for default meta image"
export const blog = {
  // RSS feed
  name: 'Stefan Taitano – Articles',
  description: 'Writing on life, software development, and things I find worth sharing.',
  // feed links are looped over in the head. You may add more to the array.
  feedLinks: [
    {
      title: 'Atom Feed',
      url: '/feed.xml',
      type: 'application/atom+xml'
    },
    {
      title: 'JSON Feed',
      url: '/feed.json',
      type: 'application/json'
    }
  ],
  // Tags
  tagSingle: 'Tag',
  tagPlural: 'Tags',
  tagMore: 'More tags:',
  // pagination
  paginationLabel: 'Articles',
  paginationPage: 'Page',
  paginationPrevious: 'Previous',
  paginationNext: 'Next',
  paginationNumbers: true
};
export const details = {
  aria: 'section controls',
  expand: 'expand all',
  collapse: 'collapse all'
};
export const dialog = {
  close: 'Close',
  next: 'Next',
  previous: 'Previous'
};
export const navigation = {
  navLabel: 'Menu',
  ariaTop: 'Main',
  ariaBottom: 'Complementary',
  ariaPlatforms: 'Platforms',
  drawerNav: false,
  subMenu: false
};
export const themeSwitch = {
  title: 'Theme',
  light: 'light',
  dark: 'dark'
};
export const greenweb = {
  // https://carbontxt.org/
  disclosures: [
    {
      docType: 'sustainability-page',
      url: `${url}/sustainability/`,
      domain: domain
    }
  ],
  services: [{domain: 'netlify.com', serviceType: 'cdn'}]
};
export const tests = {
  pa11y: {
    // keep customPaths empty if you want to test all pages
    customPaths: ['/', '/now/', '/articles/'],
    globalIgnore: []
  }
};
export const viewRepo = {
  // this is for the view/edit on github link. The value in the package.json will be pulled in.
  allow: false,
  infoText: 'View this page on GitHub'
};
export const easteregg = true;
