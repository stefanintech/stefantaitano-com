export default {
  top: [
    {
      text: 'Now',
      url: '/now/'
    },
    {
      text: 'Articles',
      url: '/articles/'
    },
    {
      text: 'Talks',
      url: '/talks/'
    },
    {
      text: 'Projects',
      url: '/projects/'
    }
  ],
  bottom: [
    {
      text: 'Bookshelf',
      url: '/bookshelf/'
    },
    {
      text: 'Field Notes',
      url: 'https://buttondown.com/stefantaitano',
      external: true
    },
    {
      text: 'Links',
      url: '/links/'
    },
    {
      text: 'Check-ins',
      url: '/checkins/'
    }
  ],
  // Tabula Rasa layout (`rasa.njk`). Legal links come from `legal`.
  rasa: {
    top: [
      {text: 'Posts', url: '/articles/'},
      {text: 'Check-ins', url: '/checkins/'},
      {text: 'Now', url: '/now/'}
    ],
    footer: [
      {text: 'Chess', url: '/chess/'},
      {text: 'Talks', url: '/talks/'},
      {text: 'Projects', url: '/projects/'},
      {text: 'Bookshelf', url: '/bookshelf/'},
      {text: 'Resume', url: '/resume/'},
      {text: 'AI', url: '/ai/'},
      {text: 'Links', url: '/links/'},
      {text: 'Field Notes', url: 'https://buttondown.com/stefantaitano', external: true}
    ]
  },
  legal: [
    {
      text: 'Privacy',
      url: '/privacy/'
    },
    {
      text: 'Accessibility',
      url: '/accessibility/'
    },
    {
      text: 'Colophon',
      url: '/colophon/'
    }
  ]
};
