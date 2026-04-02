---
title: 'Accessibility Statement'
description: 'Commitment to digital accessibility and how to report accessibility issues.'
date: "Last Modified"
permalink: /accessibility/index.html
layout: page
---

Accessibility means designing and building so that people with disabilities can use this site with fewer barriers. I care about that and try to improve the experience over time.

## Conformance status

The [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/standards-guidelines/wcag/) define three levels of conformance: A, AA, and AAA.

This site is built on the [Eleventy Excellent](https://github.com/madrilene/eleventy-excellent) starter, which is **intended** to support WCAG 2.1 Level AA. My **content and customizations** can affect how well that holds in practice, so I do not claim guaranteed compliance with any specific legal standard—only that I work toward the same goals and welcome corrections.

## Testing

The project includes **pa11y-ci** for automated checks. From the repository you can run `npm run test:a11y` after a local build setup (see `package.json` and `src/_data/meta.js` for configured paths). Automated tests do not catch every issue; manual testing and real-user feedback still matter.

## Feedback

If you run into a barrier on this site—keyboard navigation, screen readers, contrast, focus, or anything else—please tell me:

- **Email**: {{ meta.creator.email }}
- **GitHub**: [Open an issue](https://github.com/stefanintech/stefantaitano-com/issues) on the site repository (accessibility-related reports are welcome)

I will do my best to respond within a **reasonable time**, typically within about **one week**.

---

*Last updated: {{ page.date | formatDate('MMMM D, YYYY') }}*
