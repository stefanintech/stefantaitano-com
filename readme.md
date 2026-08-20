# stefantaitano.com

Personal website and writing home for Stefan Taitano.

Live site: [www.stefantaitano.com](https://www.stefantaitano.com)

This repository powers a personal site built with Eleventy. It mixes long-form writing, a `/now` page, platform links, generated feeds, and a homepage that is slowly turning into a clearer home for projects, articles, and ongoing work. Stefan is an Army veteran turned ServiceNow consultant, getting deeper into Ruby and slowly training for a 2027 marathon.

## What This Site Is

- Personal website
- Article archive
- `/now` page
- Lightweight portfolio-in-progress
- Home for experiments that do not fit cleanly on social platforms

## Current Status

- Homepage is a pixel night-sky banner, then type (no circle portrait). `/now` leads with Commit Your Code volunteering.
- Top nav is four items: Now, Articles, Talks, Projects. Bookshelf, Field Notes, and Links live in the footer.
- Inner pages share a calm intro. Talks stay cinematic. The photo is on `/links/` as a rounded square.
- Branding: slate + amber, Fraunces + Atkinson Hyperlegible + Caveat, ST monogram, favicons.
- Writing lives here. Medium is a footer identity link, not a competing CTA.
- Remaining product work: homepage header after scroll, overlay menu access details. Analytics is backlog.

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
- `src/pages/now.njk`: current `/now` page
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
3. Add one or two hand-picked internal links under `related` so the article suggests a useful next read
4. Optionally include hero image metadata if the post needs it
5. Run `npm start` or `npm run build` to verify output

```yaml
related:
  - title: A related article title
    url: /articles/related-article/
```

### Update a page

- Standalone pages live in `src/pages/`
- Shared metadata and links live in `src/_data/`
- Reusable UI pieces live in `src/_includes/partials/`
- Check `docs/site-voice.md` before writing headings, introductions, project summaries, or calls to action

### External or generated content

- Lichess data is pulled through `src/_data/lichess.js`
- Feed outputs are generated through `src/common/feed-atom.njk` and `src/common/feed-json.njk`
- `robots.txt`, `_redirects`, and `sitemap.xml` are generated from `src/common/`

## What Has Been Done

- Personalized the Eleventy Excellent starter into a custom personal site
- Rewrote the homepage around a pixel night sky, type-first intro, `/now`, recent articles, and Field Notes
- Built a `/now` page with live Lichess stats pulled at build time
- Ported three Medium articles and published one site-native post
- Applied slate + amber branding, ST monogram logo, and regenerated favicons
- Cleaned up stale starter content, demo posts, and unused data files
- Replaced the starter README with a project-specific one

## What Is Still On The Checklist

The next meaningful improvements are:

- ~~Fix the legal/imprint data path~~ Done: rewritten as a lightweight legal notice with email contact
- ~~Replace the default Open Graph image~~ Done: subtitle updated, 11ty logo replaced with ST monogram on per-post cards
- ~~Build a dedicated Projects page~~ Done: data-driven via projects.yaml, live at /projects/
- ~~Replace the interim Field Notes email CTA~~ Done: links to the Buttondown publication
- ~~Swap default fonts for something that fits the brand~~ Done: Fraunces for headings, Atkinson Hyperlegible kept for body
- ~~Decide whether to add supporting pages like `Bookshelf`, `Uses`, and `Colophon`~~ Done: Colophon live at /colophon/, Bookshelf live at /bookshelf/, Uses skipped
- ~~Add end-of-article cross-links so each post suggests the next click~~ Done: articles now use curated `related` links
- ~~Calm inner-page intros, four-item nav, and this site as the writing home~~ Done
- ~~Homepage as type under the pixel sky; Bookshelf/Projects off inline styles~~ Done
- ~~Update the colophon so it mentions the pixel sky and that the photo lives on `/links/`~~ Done
- Keep the homepage header usable after you scroll past the sky
- Finish overlay menu access details (focus trap, restore focus, Close name)
- ~~Bring the résumé into 2026 last (talk, volunteering, Ruby; drop the consulting one-pager voice)~~ Done
- Evaluate privacy-friendly analytics (backlog; currently no analytics by choice)

## To-do

- [x] Fix the legal/imprint data path
- [x] Replace the default Open Graph image
- [x] Build a dedicated `Projects` page
- [x] Replace the temporary `Field Notes` email CTA with a real signup destination
- [x] Swap fonts (Fraunces display, Atkinson Hyperlegible body)
- [x] Add optional supporting pages (Colophon and Bookshelf live; Uses skipped)
- [x] Add article cross-links or related-post navigation
- [x] Calm inner-page intros, four-item nav, writing home, type-first homepage
- [x] Update Colophon for the pixel sky and `/links/` photo
- [ ] Homepage header after scroll
- [ ] Overlay menu access details
- [x] Bring the résumé into 2026 (last)
- [ ] Evaluate privacy-friendly analytics (backlog)

## Notes For Interested Folks

This site started from the [Eleventy Excellent](https://eleventy-excellent.netlify.app/) starter, but it has been steadily reshaped into a personal site with custom homepage content, a custom `/now` page, personal metadata, feed configuration, and project-specific content structure.

If you are browsing because you are interested in the site itself, the best places to start are:

- `src/pages/index.njk`
- `src/pages/now.njk`
- `src/_data/meta.js`
- `src/_layouts/post.njk`

## Credits

- Built on top of [Eleventy Excellent](https://eleventy-excellent.netlify.app/) by Lene Saile
- Inspired by the broader Eleventy, accessibility, and build-excellent-websites community
