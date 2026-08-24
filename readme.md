# stefantaitano.com

Personal website and writing home for Stefan Taitano.

Live site: [stefantaitano.com](https://stefantaitano.com)

This repository powers a personal site built with Eleventy. Writing, talks, projects, a `/now` page, platform links, and generated feeds all live here. Stefan is an Army veteran turned ServiceNow developer, getting deeper into Ruby and slowly training for a 2027 marathon.

## What This Site Is

- Personal website
- Article archive
- `/now` page
- Talks, projects, résumé, and a `/links/` page
- Home for experiments that do not fit cleanly on social platforms

## Current Status

- Homepage is a pixel night-sky banner, then type (no circle portrait). `/now` leads with Commit Your Code volunteering.
- Top nav is four items: Now, Articles, Talks, Projects. Bookshelf, Field Notes, and Links live in the footer.
- Inner pages share a calm intro. Talks stay cinematic. The photo is on `/links/` as a rounded square; holding it is a small easter egg.
- Branding: slate + amber, Fraunces + Atkinson Hyperlegible + Caveat, ST monogram, favicons.
- Writing lives here. Medium is a footer identity link, not a competing CTA.
- Product checklist is complete. Next work is content as it comes: articles, `/now`, and projects.

## Stack

- [Eleventy](https://www.11ty.dev/) as the static site generator
- Nunjucks, Markdown, and data files for content and templates
- CUBE CSS with Tailwind utilities, design tokens, and local CSS layers
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
- Security headers and cache headers are defined in `netlify.toml`
- `vercel.json` mirrors those cache headers if the site is served from Vercel

The canonical site URL comes from `src/_data/meta.js` and defaults to:

```txt
https://stefantaitano.com
```

If needed, you can override it with the `URL` environment variable.

## Project Structure

```txt
src/
  _data/          Site metadata, navigation, personal links, projects, résumé, external data
  _includes/      Reusable partials and head templates
  _layouts/       Base, page, post, and tag layouts
  _config/        Eleventy config, filters, shortcodes, events, setup scripts
  pages/          Standalone pages: home, now, articles, talks, projects, links, résumé, bookshelf, colophon
  posts/          Blog posts and article content
  talks/          Talk pages
  now-entries/    Dated /now notes
  common/         Feeds, redirects, sitemap, robots, manifest, misc outputs
  assets/         CSS, JS, SVG, images, talk slides
```

## Key Files

- `src/pages/index.njk`: homepage and current preview sections
- `src/pages/now.njk`: current `/now` page
- `src/pages/articles.njk`: article index and pagination
- `src/pages/talks.njk` and `src/talks/`: talks index and individual talks
- `src/pages/projects.njk` and `src/_data/projects.yaml`: data-driven projects page
- `src/pages/links.njk` and `src/_data/links.yaml`: `/links/` page
- `src/pages/resume.njk` and `src/_data/resume.yaml`: résumé
- `src/_layouts/post.njk`: post layout, newsletter CTA insertion, edit link
- `src/_data/meta.js`: site URL, metadata, feeds, theme, and testing config
- `src/_data/navigation.js`: top and bottom navigation links
- `src/_data/personal.yaml`: personal links and profile/platform data
- `src/_includes/partials/newsletter-cta.njk`: current Field Notes CTA
- `netlify.toml`: deployment, security, and cache header config
- `docs/site-voice.md`: voice guide for page copy

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
- Seven articles live in `src/posts/` (some started on Medium; later posts are site-native)
- Added a Talks page, starting with the RubyConf 2026 lightning talk
- Applied slate + amber branding, ST monogram logo, and regenerated favicons
- Cleaned up stale starter content, demo posts, and unused data files
- Replaced the starter README with a project-specific one
- Tightened first-visit and repeat-visit performance (cache headers, image formats, less JS on every page)

## Product checklist

Complete. Content (articles, `/now`, projects) lands as it comes.

- ~~Fix the legal/imprint data path~~ Done: rewritten as a lightweight legal notice with email contact
- ~~Replace the default Open Graph image~~ Done: subtitle updated, 11ty logo replaced with ST monogram on per-post cards
- ~~Build a dedicated Projects page~~ Done: data-driven via `projects.yaml`, live at `/projects/`
- ~~Replace the interim Field Notes email CTA~~ Done: links to the Buttondown publication
- ~~Swap default fonts for something that fits the brand~~ Done: Fraunces for headings, Atkinson Hyperlegible kept for body
- ~~Decide whether to add supporting pages like `Bookshelf`, `Uses`, and `Colophon`~~ Done: Colophon live at `/colophon/`, Bookshelf live at `/bookshelf/`, Uses skipped
- ~~Add end-of-article cross-links so each post suggests the next click~~ Done: articles now use curated `related` links
- ~~Calm inner-page intros, four-item nav, and this site as the writing home~~ Done
- ~~Homepage as type under the pixel sky; Bookshelf/Projects off inline styles~~ Done
- ~~Update the colophon so it mentions the pixel sky and that the photo lives on `/links/`~~ Done
- ~~Keep the homepage header usable after you scroll past the sky~~ Done: it follows and switches to page colors past the hills
- ~~Finish overlay menu access details (focus trap, restore focus, Close name)~~ Done
- ~~Bring the résumé into 2026 last (talk, volunteering, Ruby; drop the consulting one-pager voice)~~ Done

## Notes For Interested Folks

This site started from the [Eleventy Excellent](https://eleventy-excellent.netlify.app/) starter, but it has been steadily reshaped into a personal site with custom homepage content, a custom `/now` page, personal metadata, feed configuration, and project-specific content structure.

If you are browsing because you are interested in the site itself, the best places to start are:

- `src/pages/index.njk`
- `src/pages/now.njk`
- `src/_data/meta.js`
- `src/_layouts/post.njk`
- `docs/site-voice.md`

## Credits

- Built on top of [Eleventy Excellent](https://eleventy-excellent.netlify.app/) by Lene Saile
- Inspired by the broader Eleventy, accessibility, and build-excellent-websites community
