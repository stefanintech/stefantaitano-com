# Site reference (layout, CSS, config)

The site started from [Eleventy Excellent](https://eleventy-excellent.netlify.app/get-started/) and kept its config layout, image pipeline, and SVG shortcode. Since Tabula Rasa Phase 6 (`docs/tabula-rasa-project-plan.md`) the look is its own: one layout, one plain stylesheet, no Tailwind, no CUBE layers, no design-token pipeline. The upstream style guide no longer describes this site.

Older plans in `docs/` (chess, check-ins, redesign, retro skin, footer counter) name pre-switch paths such as `src/assets/css/local/` and `global/base/variables.css`. Those files are gone. Use this page instead.

---

## Layouts

`eleventy.config.js` maps three aliases. Templates use the alias, not the file name.

| Alias | File | Used by |
| --- | --- | --- |
| `base` | `src/_layouts/rasa.njk` | Home, list pages, chess, check-ins, links, 404 |
| `page` | `src/_layouts/rasa-page.njk` | Markdown pages (privacy, accessibility, colophon): `<h1>` and prose |
| `post` | `src/_layouts/rasa-post.njk` | Posts in `src/posts/`: title, date, prose, "Keep reading" |

`src/_layouts/talk.njk` is the talk page and sits on `base`.

- Header: `src/_includes/rasa/header.njk`. Name links home, then Posts, Check-ins, Now. `compactHeader: true` (used by `/links/`) swaps it for a single Home link and hides the footer page list.
- Footer: `src/_includes/rasa/footer.njk`. Lichess status, the other pages, feeds, `navigation.legal`, theme switch.
- Home: `src/pages/index.njk` → `src/_includes/rasa/home.njk`. The approved intro, then `collections.homeStream` (newest 30 posts, check-ins, and `/now` entries) through `rasa/stream.njk` and the `card-*.njk` partials.
- Head: `head/js-inline.njk` (theme script, Lichess status; keep the storage key), `head/schema.njk`, `head/meta-info.njk`, `head/js-defer.njk`.

## CSS

Plain CSS in `src/assets/css/rasa/`. `src/_config/events/build-css.js` runs each file through postcss-import and cssnano into `src/_includes/css/rasa-<name>.css`. Nothing else is in the pipeline.

| File | What it styles |
| --- | --- |
| `site.css` | Palette, fonts, column, header, footer, stream cards, check-in day/night rule. Every page. |
| `prose.css` | Post and Markdown page bodies |
| `syntax.css` | Code highlighting, both themes |
| `articles.css`, `now.css`, `checkins.css`, `chess.css` | Those pages |
| `pages.css` | Talks, projects, bookshelf, resume, AI, links, 404 |

Add page CSS with the `rasa` bucket. The layout inlines the whole bucket in a `<style>` tag, so there is no stylesheet URL to cache-bust.

```njk
{%- css "rasa" -%}
  {%- include "css/rasa-pages.css" -%}
{%- endcss -%}
```

- **Palette.** Six custom properties in `site.css`, light and dark: `--bg`, `--text`, `--muted`, `--rule`, `--accent`, `--card`. Dark applies on `:root[data-theme='dark']` and, with no stored choice, `prefers-color-scheme: dark`. Don't add colours outside these six.
- **Type.** `--font-hand` (Caveat, headings only, self-hosted under `src/assets/fonts/caveat/`), `--font-body` (`system-ui` stack), `--font-code` (`ui-monospace`). `--column` is the 40rem reading width.
- **Style.** Native nesting, `:where()` for low specificity, no utility classes, no framework.
- **Check-in images.** `partials/checkin-figure.njk` prints a day and a night `<img>`. `site.css` shows the day image unless `data-theme` is `dark`. Don't tint them with CSS.
- **Cache.** Netlify caches `/assets/*` for a month. New CSS goes in the inline bucket or gets a new filename.

## Eleventy config

Modular config under `src/_config/`: `collections.js`, `events.js`, `filters.js`, `plugins.js`, `shortcodes.js`. Register additions in `eleventy.config.js` from those modules.

## Content and site data

- Site strings and options: `src/_data/meta.js`
- Person and socials: `src/_data/personal.yaml`
- Footer legal links: `src/_data/navigation.js`
- Redirects: static lines and `redirectFrom` front matter, both in `src/common/_redirects.njk`

## Images

Eleventy Image: HTML transform, Markdown `![]()`, or Nunjucks `{% image %}` / `{% imageKeys %}`. Use `eleventy:ignore` on an `<img>` to skip optimization.

## SVG shortcode

```njk
{% svg "folder/name", "Accessible name or null", "class-names", "optional: inline style" %}
```

Paths are under `src/assets/svg/`. Default: `aria-hidden="true"` when no accessible name.

## Other pieces

- **WebC.** Only `<custom-youtube>` (talk page) and its link fallback remain, in `src/_includes/webc/`.
- **Theme switch.** In the footer. Keep the IDs and `data-theme-switcher`; `theme-toggle.js` binds to them.
- **OG images.** `src/common/og-*.njk` include the Caveat templates in `src/_includes/rasa/og-*.njk`; `svg-to-png.js` rasterizes them with the fonts in `src/_config/og-fonts/`. `npm run clean:og` resets generated images.
- **A11y tests.** `npm run test:a11y` (pa11y-ci; paths from `meta.js`).
