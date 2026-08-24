---
title: Colophon
discover:
  title: Colophon
permalink: /colophon/index.html
description: How this site is made - the type, colors, tools, and principles behind stefantaitano.com.
date: 2026-08-19
layout: page
---

In the back of older books you would sometimes find a colophon: a short note about the typefaces, the paper, and the printer. This is that page for this website. If you are curious how the site is made and why it looks the way it does, you are in the right place.

## Type

Headings are set in [Fraunces](https://fonts.google.com/specimen/Fraunces), a warm editorial serif by Undercase Type. I wanted headings that felt more like a personal publication than a product landing page, and the heavy 72pt display cut has just enough character without shouting.

Body text is set in [Atkinson Hyperlegible](https://fonts.google.com/specimen/Atkinson+Hyperlegible), designed by the Braille Institute to increase legibility for readers with low vision. It came with the starter this site is built on, and keeping it was a deliberate choice: a site should be easy to read before it is anything else.

The little handwritten asides you will spot around the site are [Caveat](https://fonts.google.com/specimen/Caveat). They are the margin notes of this site, used sparingly and never for anything you actually need to read.

All fonts are subsetted, self-hosted, and treated as an enhancement. If they have not loaded yet, or never load, the site falls back to system fonts and stays perfectly readable. The handwritten Caveat cut is decorative, so the browser is allowed to skip it on a slow first visit.

## Color

The palette is slate and amber on warm cream. The background started life as a neutral gray and was deliberately warmed up, because cream reads like paper and gray reads like a settings menu. There is a dark theme too, built on warm charcoal rather than cold black, which follows your system preference or the toggle in the header.

The homepage sky is the exception: that band is always night, even when the rest of the page is in light mode. The hills fade into whatever the current page background is.

## Built with

- [Eleventy](https://www.11ty.dev/), a static site generator
- [Eleventy Excellent](https://eleventy-excellent.netlify.app/), the excellent starter by [Lene Saile](https://www.lenesaile.com/) that this site grew out of
- [CUBE CSS](https://cube.fyi/) with [Every Layout](https://every-layout.dev/) compositions, design tokens, and a [Utopia](https://utopia.fyi/) fluid type and space scale
- [Netlify](https://www.netlify.com/) for hosting and deploys

## Principles

The site follows [progressive enhancement](https://piccalil.li/blog/its-about-time-i-tried-to-explain-what-progressive-enhancement-actually-is/): solid HTML first, CSS as a layer on top, JavaScript only where it genuinely improves the experience. Almost everything here works with JavaScript turned off.

There are no analytics and no tracking scripts, by choice. I have no idea how many people read this site, and so far that has been fine.

The site stays small on purpose: CSS is inlined, images are converted to AVIF and WebP at build time, and hashed assets are cached for a long time so repeat visits do not download the same files again.

Accessibility gets checked with automated [pa11y](https://pa11y.org/) tests, though automation only catches so much. If something is hard to use, [tell me](/accessibility/).

## Small details

- The homepage night sky is original pixel canvas, not a stock illustration: a moon, a knight of stars, a runner, a campfire, and an airplane. It is JavaScript on top of a static fallback, and it freezes if you prefer reduced motion.
- My photo lives on the [links page](/links/), as a rounded square. The homepage intro under the hills is just type.
- [Talks](/talks/) keep a more cinematic treatment on purpose. The rest of the inner pages use a shared quiet intro: a handwritten kicker, a Fraunces title, and one sentence.
- [Field Notes](https://buttondown.com/stefantaitano) is an occasional email, hosted on Buttondown.
- The chess stats on the [now page](/now/) are pulled from the Lichess API at build time, so they update whenever the site deploys.
- The now page itself is a little journal: each update is a dated Markdown file, and the newest one is promoted to the top automatically.
- Social preview images are generated from SVG templates at build time, set in Fraunces to match the site.

## Type history

<details>
<summary>Previous typefaces</summary>

The site launched with Red Hat Display for headings, inherited from the starter. It was swapped for Fraunces in July 2026 as part of a broader warming of the whole design.

</details>

---

*Last updated: {{ page.date | formatDate('MMMM D, YYYY') }}*
