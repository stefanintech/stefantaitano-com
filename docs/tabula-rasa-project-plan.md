# Tabula Rasa — Project plan

Rebuild the layout and theme of stefantaitano.com from a blank page. Carry the content over exactly as it is. One small PR per phase.

**Status (10 Oct 2026):** Plan only. No phase has started. Waiting on Stefan's calls under "Open decisions."

**Outcome:** The home page is a short intro followed by one newest-first stream of posts, check-ins, and `/now` updates. Every page uses one new layout and one plain stylesheet. The Eleventy Excellent look (Tailwind tokens, CUBE layers, Fraunces / Atkinson, the pixel scene) is gone. Every URL that works today still works, or 301s to where its content went.

**Inspiration**

- [Robb Knight, "Tabula Rasa"](https://rknight.me/blog/tabula-rasa/): delete everything, then pull back only what earns its place. A hand-drawn heading font with `system-ui` body text.
- [melaniekat.com](https://melaniekat.com): one Eleventy site, one home stream mixing posts, short dated notes, and photos, with very little nav.

**Cut**

- Rewriting, trimming, or re-dating any post, `/now` entry, check-in, talk, or project copy
- New check-in front-matter keys, new image sizes, or any change to the check-in validator
- New URLs for existing content (new routes are fine; old ones stay or redirect)
- A CSS framework, Tailwind, utility classes, or a design-token JSON pipeline for the new layout
- Client-side JavaScript for the feed. The stream is built at build time.
- Comments, likes, webmentions, a guestbook, or a photo section separate from check-ins
- A second site, subdomain, or framework. This stays the same Eleventy 3 repo, `src/` in, `dist/` out.

---

## Inventory

Keep = same URL, new look. Move = content goes somewhere else. Cut = suggestion for Stefan to confirm; a cut URL gets a 301.

### Routes

| Route | What it is today | Call |
| --- | --- | --- |
| `/` | Home C: cycling "stefan is ___", bio, writing / project / chess / talk rows, pixel horizon | **Move.** Becomes intro + stream. Systems line and bio carry over verbatim. |
| `/articles/`, `/articles/page-N/` | Paginated post list | Keep |
| `/articles/<slug>/` | Posts, with related reading | Keep. Same slugs, same permalinks. |
| `/now/` | Latest entry, "Previously…" archive, chess stats | Keep. Each entry gets an `id` so the stream can link to it. |
| `/checkins/` | Clay relief map, city list, month timeline | Keep. Map data, exclusion logic, and anchors untouched. |
| `/chess/` | Live Lichess data, study embed, compare | Keep. `lichess.js` and `study.json` untouched. |
| `/talks/`, `/talks/rubyconf-2026/`, `/talks/rubyconf-2026/slides/` | Talks | Keep. The slides are their own HTML; leave them alone. |
| `/projects/`, `/bookshelf/`, `/resume/` (+ PDF), `/ai/` | Inner pages | Keep |
| `/links/` | Compact profile card | Keep |
| `/privacy/`, `/accessibility/`, `/colophon/` | Footer legal links | Keep. The colophon describes the old fonts and starter, so it needs Stefan's new copy (see decisions). |
| `/imprint/`, `/sustainability/` | Pages nothing links to | Keep URL, leave unlinked (or cut, see decisions) |
| `/tags/`, `/tags/<tag>/` | Tag index. No post has tags today. | **Cut** → 301 to `/articles/` |
| `/styleguide/` | Eleventy Excellent token showcase | **Cut** → 301 to `/` |
| `/feed.xml`, `/feed.json` | Atom and JSON feeds, posts only | Keep. Same URLs, same entry IDs. |
| `/sitemap.xml`, `/robots.txt`, `/humans.txt`, `/carbon.txt`, `/site.webmanifest`, `/404.html`, `/_redirects` | Plumbing | Keep |
| OG images (`/assets/og-images/*`) | SVG → PNG at build | Keep the pipeline. Restyle the templates in the last phase. |

### Features

| Feature | Call |
| --- | --- |
| Light / dark with a theme switch (`theme-toggle.js`, `data-theme`) | Keep the mechanism and storage key; restyle the control |
| Check-in day / night images (`checkin-figure.njk`) | Keep. Same partial, new CSS. |
| City map (`checkin-map.njk`, `checkin-cities.njk`) | Keep. Port the colours; keep PR 3's contrast and 44px targets. |
| Scheduled rebuild (`netlify/functions/checkin-rebuild.js`) | Keep, untouched |
| Lichess status pill in the header (`lichess-status` function) | Keep, smaller (see decisions) |
| Field Notes link | Keep, in the footer |
| `stefan` pawn confetti, `/links/` Lichess egg | Keep. JS only, no theme ties. |
| "stefan is ___" cycling wordmark | **Cut** |
| Pixel night scene and horizon | **Cut** |
| Footer Rapid hit counter | **Cut** (chess numbers stay on `/chess/` and `/now/`) |
| Retro 2005 / 2006 skins | **Cut**. They restyle the old home and links markup. |
| Nav drawer, header dock, masonry, gallery, WebC embeds | **Cut** if no page uses them after the switch (grep first) |
| Tailwind, CUBE layers, `designTokens/*.json`, Fraunces, Atkinson | **Cut** after the switch |
| pa11y-ci | Keep, pointed at the new pages |

---

## Hard constraints (carried over unchanged)

These hold in every phase. If a phase needs to change one, stop and ask.

- **Posts.** `src/posts/` files, front matter, and permalinks (`/articles/<slug>/`) stay byte-for-byte.
- **`/now` entries.** `src/now-entries/*.md`, dated by filename, `permalink: false`. Content unchanged. The stream reads `collections.nowEntries`.
- **Check-ins.** Everything in `.cursor/rules/checkins.mdc` still applies:
  - Same files in `src/checkins/`, same required and optional keys. The validator in `src/_config/utils/checkins.js` is not loosened.
  - The day / night WebP pair, 1600×1067, at most 250,000 bytes, no metadata. The page shows the one that matches the theme.
  - The `publishAfter` delay and the build-time filter in `getCheckins`. Templates read check-ins **only** through `collections.checkins`, never `collections.all` or the folder. The home stream included.
  - `CHECKIN_MAP_EXCLUDE` stays the only home-area list. Never committed, logged, or echoed, not even in tests or PRs. Production still fails without it.
  - No coordinates, addresses, trailheads, or directions in HTML, JSON, feeds, or `data-` attributes. Places only, no people.
- **City map.** `cityCentroids.json`, `checkinMapOutline.json`, the projection, the "near metro" grouping, and the opaque `checkin-<hash>` anchors stay as they are.
- **Light and dark.** Both themes, plus `prefers-color-scheme` when no choice is stored. Contrast at least 4.5:1 for text, 3:1 for map beads and focus rings.
- **URLs.** Every HTML path in `dist/` on `main` today still exists after the switch, or has a 301 in `_redirects`.
- **RSS.** `/feed.xml` and `/feed.json` keep their URLs, titles, and entry IDs, so no reader sees old posts as new.
- **Secrets.** `CHECKIN_REBUILD_HOOK_URL`, `CHECKIN_MAP_EXCLUDE`, and any Lichess token are referred to by name only.

---

## The new home

1. **Intro.** Two or three sentences: the current systems line ("I build systems for a living and escape plans for fun.") and the current bio, verbatim. A small photo (`stefan.png`) if Stefan wants it. No cycling verb, no CTA block.
2. **Stream.** One newest-first list, built at build time from three collections:

| Type | Source | Card |
| --- | --- | --- |
| Post | `collections.allPosts` | Title (link), date, `description` |
| Check-in | `collections.checkins` | Clay image (day / night pair via `checkin-figure.njk`, with its `alt`), place (or city when `precision: city`), "City, Region", the one-line note, date. Links to `/checkins/#checkin-<hash>`. No image key → text-only card. |
| Now | `collections.nowEntries` | Date, the entry body (they are short), link to `/now/#now-YYYY-MM-DD` |

- Sort by the visible date. Check-ins sort by `date` (the visit day), never `publishAfter`.
- Each card says what it is in small text ("Post", "Checked in", "Now"), so a screen reader hears the type first.
- Home shows the newest 30 (see decisions). The archives stay at `/articles/`, `/now/`, and `/checkins/`.

---

## Visual direction

- **Type.** One characterful heading face, hand-drawn in the spirit of Robb's Founder's Hand. Body, UI, and code in the system stack (`system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`; `ui-monospace` for code). Headings only, self-hosted, subsetted, `font-display: swap`. Candidates: Caveat (already self-hosted and in the OG pipeline), a licensed hand face like Founder's Hand (check the web licence first), or another OFL hand face. Phase 1 renders two or three side by side on `/next/` for Stefan to pick.
- **Palette.** Keep the warm cream / ink / amber / gold that the September design review called the best part, flattened to six custom properties.

| Token | Light | Dark |
| --- | --- | --- |
| `--bg` | `#fbf8f3` cream | `#19150e` ink |
| `--text` | `#322d25` | `#fbf8f3` |
| `--muted` | `#686258` | `#b0ada8` |
| `--rule` | `#e7e4de` | `#3f3a30` |
| `--accent` (links) | `#b45309` amber | `#fbbe25` gold |
| `--card` | `#ffffff` | `#322d25` |

  Check every pair for contrast in Phase 1 before building on it.
- **Layout.** One centred column, about 40rem. Cards separated by hairlines, not boxes and shadows. Images full column width, rounded a little.
- **Nav.** Name on the left (links home). Three or four links on the right, no drawer. Everything else in the footer. Proposed: Articles, Now, Check-ins, Chess.
- **CSS.** Plain CSS. One site stylesheet plus a few page files, custom properties, native nesting, `:where()` for low specificity. No Tailwind, no build-time tokens, no utility classes.

---

## How it ships without breaking the live site

The new layout is built next to the old one and only takes over in the last phase.

- **New files:** `src/_layouts/rasa.njk` (and `rasa-post.njk` when posts need it), `src/_includes/rasa/` for header, footer, and cards, and `src/assets/css/rasa/` for the stylesheets.
- **CSS bucket:** pages add a `{% css "rasa" %}` block next to their existing `{% css "local" %}` block. The old base layout prints only `global` and `local`. The new one prints only `rasa`. They never mix.
- **CSS build:** one extra block in `src/_config/events/build-css.js` builds `src/assets/css/rasa/**` with postcss-import and cssnano only, no Tailwind, into `src/_includes/css/rasa-*.css`.
- **Preview in production:** `/next/` is a real page with the new home. It has `noindex`, is excluded from the sitemap, feeds, and `collections.all`, and nothing links to it.
- **Preview of every other page:** a build flag, `TABULA_RASA=1`, swaps the `base`, `page`, and `post` layout aliases in `eleventy.config.js` to the new layouts. Production never sets it before the switch. Locally: `TABULA_RASA=1 npm run build`.

This is a deliberate, temporary exception to "do not invent a parallel layout." The last phase removes it.

---

## Standing rules

- One phase per session. Commit at the end. Do not start the next until Stefan says next phase.
- Live pages render the same on `main` after every phase until Phase 6. Check by diffing `dist/` HTML (minus `/next/`) against a build of `main`.
- Content files are read-only in this project: `src/posts/`, `src/now-entries/`, `src/checkins/`, `src/talks/`, `src/_data/*.yaml`.
- Copy: `docs/site-voice.md`. New labels are plain ("Checked in", "Older posts"). Do not write a new bio or new intro without Stefan.
- `npm run build` passes in every phase, including `npm run test:checkins`.
- No Lichess changes. If a page needs a new Lichess field, stop; see `.cursor/rules/chess-page.mdc`.

---

## Phase 1 — Skeleton at `/next/`

**Build:** `rasa.njk` with header (name + nav), main, footer (Field Notes, feeds, legal links, theme switch). `src/assets/css/rasa/site.css` with the palette, type, and column. The heading-font candidates self-hosted under `src/assets/fonts/`. `/next/` shows the intro only, plus a heading specimen for each candidate font.

**Gotchas:** keep the theme switch's existing storage key and the inline script in `head/js-inline.njk`, or the choice is lost when the site switches. `noindex` on `/next/`. Exclude it from `showInSitemap` and the feeds.

**Done when**

- `/next/` renders in light and dark, at 1440 and 390, with no horizontal scroll.
- Every palette pair clears the contrast targets.
- Every other page's HTML is unchanged against `main`. `/next/` is not in `sitemap.xml`.

---

## Phase 2 — The stream on `/next/`

**Build:** a `homeStream` collection in `src/_config/collections.js` that merges `allPosts`, `nowEntries`, and `checkins` (from the filtered collection only) and sorts newest first. Card partials in `src/_includes/rasa/`: `card-post.njk`, `card-checkin.njk` (reuses `checkin-figure.njk`), `card-now.njk`. Add `id="now-YYYY-MM-DD"` to each entry on `/now/`. That is the one additive change to a live page.

**Tests:** extend the check-in fixture tests: a future `publishAfter` and a draft never appear in the stream, and the stream HTML has no `lat`, `lon`, or coordinate-looking numbers.

**Gotchas**

- Now-entry dates come from filenames (UTC midnight); check-in `date` is the local visit day; posts carry an offset. Compare by calendar day with `formatDateUtc`, or same-day items jump around.
- Use `checkinAnchor` for check-in links so no date ends up in a URL.
- `precision: city` has no `place`. The card shows the city as its title.
- The 24 Sep `/now` entry has an image with `eleventy:widths`. It has to render through the image transform.

**Done when:** `/next/` shows every published item in the right order, with both check-in images switching with the theme. The fixture tests pass. Live `/` is unchanged.

---

## Phase 3 — Posts, articles, and `/now`

**Build:** `rasa-post.njk` (title, date, prose, related reading). `rasa` CSS blocks for `/articles/` (plain dated list, same pagination URLs) and `/now/` (latest, "Previously…", chess stats table). Prose styles: headings in the hand face, code in `ui-monospace`, images and tables that don't overflow at 390.

**Gotchas:** syntax highlighting needs a small new theme that works in both modes; the old one lives in `local/syntax.css`.

**Done when:** with `TABULA_RASA=1`, every post, `/articles/`, `/articles/page-2/`, and `/now/` read well in both themes at 1440 and 390. Without the flag they match `main`.

---

## Phase 4 — Check-ins and chess

**Build:** `rasa` CSS for `/checkins/` (map, city list, timeline) and `/chess/` (scoreboard, games table that stacks under 40em, study embed).

**Gotchas**

- The map colours come from the palette tokens. Re-check PR 3 of `docs/checkins-map-project-plan.md`: amber rim on light land, gold on dark, 3:1 beads, 4.5:1 labels, 3px focus ring, 44px targets.
- Do not touch `src/_config/utils/checkin-map.js`, `cityCentroids.json`, or the outline. CSS and markup classes only.
- With `CHECKIN_MAP_EXCLUDE` missing locally, the city list is left out on purpose. That is not a bug to fix.

**Done when:** with the flag, `/checkins/` works with the keyboard and with JavaScript off, axe reports no violations, and `/chess/` has no sideways scroll at 390. Without the flag, both match `main`.

---

## Phase 5 — Everything else

**Build:** `rasa` CSS for `/talks/` and the talk page, `/projects/`, `/bookshelf/`, `/resume/`, `/ai/`, `/links/`, the legal pages, and `/404.html`. Restyle the OG SVG templates in the new heading face.

**Gotchas:** `/links/` uses `compactHeader`; keep that flag working in `rasa.njk`. Leave `/talks/rubyconf-2026/slides/` alone.

**Done when:** with the flag, every page in `sitemap.xml` renders in both themes at 1440 and 390, and `npm run test:a11y` passes.

---

## Phase 6 — Switch over

**Build**

- Point the `base`, `page`, and `post` aliases at the new layouts for good. Remove the flag. Move the stream from `/next/` to `/`. Delete `/next/`.
- Add 301s for the cuts Stefan confirmed (`/tags/*` → `/articles/`, `/styleguide/` → `/`, anything else) through `redirectFrom` or static lines in `src/common/_redirects.njk`.
- Delete the old layouts, the `global` and `local` CSS, Tailwind and the token pipeline, the old fonts, and the cut features. Grep before each deletion.
- Update `.cursor/rules/eleventy-excellent.mdc`, `docs/eleventy-excellent-reference.md`, and `AGENTS.md` to describe the new layout and CSS. Put Stefan's new colophon copy in.

**Gotchas**

- Diff the list of HTML paths in `dist/` against a build of `main`. Each missing path needs a 301.
- Diff `/feed.xml` and `/feed.json` against `main`. Entry IDs and URLs must match.
- Netlify caches `/assets/*` for a month. New CSS goes in the inline bundle or gets a new filename.

**Done when**

- `/` is the new home. No page uses the old theme.
- The URL diff is clean or fully redirected. The feeds diff shows no ID changes.
- A production build fails without `CHECKIN_MAP_EXCLUDE`, the same as today. `npm run build` and `npm run test:a11y` pass.

---

## Open decisions for Stefan

1. **Heading font:** Caveat (free, already here), a licensed hand face like Founder's Hand, or another free hand face. Pick from the Phase 1 specimen.
2. **Cuts:** confirm pixel scene, "stefan is ___", hit counter, retro skins, `/tags/`, `/styleguide/`. Keep or cut `/imprint/` and `/sustainability/`.
3. **Nav:** Articles, Now, Check-ins, Chess? Or keep today's Now, Articles, Talks, Projects?
4. **Lichess pill:** keep it in the header, move it to the footer, or drop it.
5. **Home length:** newest 30 with links to the archives, or paginate the stream (`/page/2/`).
6. **Feeds:** keep `/feed.xml` posts-only, or add a second "everything" feed with check-ins and `/now` (published check-ins only).
7. **Colophon:** Stefan writes the new type and stack paragraph, or approves a draft.

---

## After it ships

Leave this file in `docs/`. Update **Status** at the top when each phase lands.
