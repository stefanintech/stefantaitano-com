# stefantaitano.com

Personal website and writing home for Stefan Taitano.

Live site: [www.stefantaitano.com](https://www.stefantaitano.com)

This repository powers a personal site built with Eleventy. It mixes long-form writing, a `/now` page, platform links, generated feeds, and a homepage that is slowly turning into a clearer home for projects, articles, and ongoing work.

## What This Site Is

- Personal website
- Article archive
- `/now` page
- Lightweight portfolio-in-progress
- Home for experiments that do not fit cleanly on social platforms

## Current Status

- `Phase 1` work is effectively done: crawling, metadata, social preview cleanup, and stale-reference cleanup.
- `Phase 2` work is effectively done: the homepage rewrite, clearer navigation, and a stronger `/now` path are live.
- The biggest remaining product work is turning temporary sections into real destinations and tightening content flow.

## Stack

- [Eleventy](https://www.11ty.dev/) as the static site generator
- Nunjucks, Markdown, and data files for content and templates
- Tailwind-based styling plus local CSS layers
- Netlify for deployment
- Generated Atom and JSON feeds
- Generated Open Graph assets and image optimization
- Accessibility checks available through `pa11y`

## Local Development

### Requirements

- Node `>=20`

### Install

```bash
npm install
```

### Run locally

```bash
npm start
```

### Build for production

```bash
npm run build
```

### Run accessibility checks

```bash
npm run test:a11y
```

## Deployment

The site is configured for Netlify.

- Build command: `npm run build`
- Publish directory: `dist`
- Security headers are defined in `netlify.toml`

The canonical site URL comes from `src/_data/meta.js` and defaults to:

```txt
https://www.stefantaitano.com
```

If needed, you can override it with the `URL` environment variable.

## Project Structure

```txt
src/
  _data/          Site metadata, navigation, personal links, external data
  _includes/      Reusable partials and head templates
  _layouts/       Base, page, post, and tag layouts
  _config/        Eleventy config, filters, shortcodes, events, setup scripts
  pages/          Standalone pages like home, now, privacy, accessibility
  posts/          Blog posts and article content
  common/         Feeds, redirects, sitemap, robots, manifest, misc outputs
  assets/         CSS, JS, SVG, images
```

## Key Files

- `src/pages/index.njk`: homepage and current preview sections
- `src/pages/now.md`: current `/now` page
- `src/pages/articles.njk`: article index and pagination
- `src/_layouts/post.njk`: post layout, newsletter CTA insertion, edit link
- `src/_data/meta.js`: site URL, metadata, feeds, theme, and testing config
- `src/_data/navigation.js`: top and bottom navigation links
- `src/_data/personal.yaml`: personal links and profile/platform data
- `src/_includes/partials/newsletter-cta.njk`: current Field Notes CTA
- `netlify.toml`: deployment and security header config

## Content Workflow

### Add a new article

1. Create a new Markdown file in `src/posts/`
2. Add front matter such as `title`, `description`, and `date`
3. Optionally include hero image metadata if the post needs it
4. Run `npm start` or `npm run build` to verify output

### Update a page

- Standalone pages live in `src/pages/`
- Shared metadata and links live in `src/_data/`
- Reusable UI pieces live in `src/_includes/partials/`

### External or generated content

- Lichess data is pulled through `src/_data/lichess.js`
- Feed outputs are generated through `src/common/feed-atom.njk` and `src/common/feed-json.njk`
- `robots.txt`, `_redirects`, and `sitemap.xml` are generated from `src/common/`

## What Is Still On The Checklist

The next meaningful improvements are:

- Create a real Projects experience instead of keeping it as a homepage placeholder
- Add stronger end-of-article cross-links so each post suggests the next click
- Replace the interim `Field Notes` email CTA with a real signup flow or dedicated page
- Fix the legal/imprint data path so `personal.address` is either defined or the page is rewritten
- Decide whether to add supporting pages like `Bookshelf`, `Uses`, and `Colophon`
- Evaluate privacy-friendly analytics

## To-do

- [ ] Build a dedicated `Projects` page
- [ ] Add article cross-links or related-post navigation
- [ ] Replace the temporary `Field Notes` email CTA with a real signup destination
- [ ] Finish the legal/imprint data path
- [ ] Add optional supporting pages like `Uses`, `Bookshelf`, or `Colophon`
- [ ] Evaluate privacy-friendly analytics

## Notes For Interested Folks

This site started from the [Eleventy Excellent](https://eleventy-excellent.netlify.app/) starter, but it has been steadily reshaped into a personal site with custom homepage content, a custom `/now` page, personal metadata, feed configuration, and project-specific content structure.

If you are browsing because you are interested in the site itself, the best places to start are:

- `src/pages/index.njk`
- `src/pages/now.md`
- `src/_data/meta.js`
- `src/_layouts/post.njk`

## Credits

- Built on top of [Eleventy Excellent](https://eleventy-excellent.netlify.app/) by Lene Saile
- Inspired by the broader Eleventy, accessibility, and build-excellent-websites community
