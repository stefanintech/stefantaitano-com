# Tabula Rasa — Project plan

Rebuild the layout and theme of stefantaitano.com from a blank page. Carry the content over exactly as it is. One small PR per phase.

**Status (10 Oct 2026):** Plan only. No phase has started. Every open question is decided (see "Decisions"). Nothing is blocking Phase 1.

**Outcome:** The home page is a short intro followed by one newest-first stream of posts, check-ins, and `/now` updates. Every page uses one new layout and one plain stylesheet. The Eleventy Excellent look (Tailwind tokens, CUBE layers, Fraunces / Atkinson, the pixel scene) is gone. Every URL that works today still works, or 301s to where its content went.

**Inspiration**

- [Robb Knight, "Tabula Rasa"](https://rknight.me/blog/tabula-rasa/): delete everything, then pull back only what earns its place. A hand-drawn heading font with `system-ui` body text.
- [melaniekat.com](https://melaniekat.com): one Eleventy site, one home stream mixing posts, short dated notes, and photos, with very little nav. [/pics](https://melaniekat.com/pics) is the model for the check-ins grid.

**Cut**

- Rewriting, trimming, or re-dating any post, `/now` entry, check-in, talk, or project copy
- New check-in front-matter keys, new image sizes, or any change to the check-in validator
- New URLs for existing content (new routes are fine; old ones stay or redirect)
- A CSS framework, Tailwind, utility classes, or a design-token JSON pipeline for the new layout
- Client-side JavaScript for the feed. The stream is built at build time.
- Comments, likes, webmentions, or a guestbook
- A separate gallery of real photos. Check-ins only have the clay dioramas, because original photos are never kept. A real-photo section is out of scope unless Stefan asks for it later.
- A second site, subdomain, or framework. This stays the same Eleventy 3 repo, `src/` in, `dist/` out.

---

## Inventory

Keep = same URL, new look. Move = content goes somewhere else. Cut = decided. Phase 6 deletes it, and every removed URL gets a 301.

### Routes

| Route | What it is today | Call |
| --- | --- | --- |
| `/` | Home C: cycling "stefan is ___", bio, writing / project / chess / talk rows, pixel horizon | **Move.** Becomes the approved intro, then the newest 30 items. |
| `/articles/`, `/articles/page-N/` | Paginated post list | Keep |
| `/articles/<slug>/` | Posts, with related reading | Keep. Same slugs, same permalinks. |
| `/now/` | Latest entry, "Previously…" archive, chess stats | Keep. Each entry gets an `id` so the stream can link to it. |
| `/checkins/` | Clay relief map, city list, month timeline | Keep the URL. Map and city list stay. The month timeline becomes a diorama grid (Phase 4). |
| `/chess/` | Live Lichess data, study embed, compare | Keep. `lichess.js` and `study.json` untouched. |
| `/talks/`, `/talks/rubyconf-2026/`, `/talks/rubyconf-2026/slides/` | Talks | Keep. The slides are their own HTML; leave them alone. |
| `/projects/`, `/bookshelf/`, `/resume/` (+ PDF), `/ai/` | Inner pages | Keep |
| `/links/` | Compact profile card | Keep |
| `/privacy/`, `/accessibility/`, `/colophon/` | Footer legal links | Keep. Phase 5 replaces the colophon body with the approved paragraph. |
| `/imprint/` | Legal notice. Nothing links to it. | **Cut** → 301 to `/privacy/`. The email is already on `/privacy/`, `/links/`, `/resume/`, and the 404. |
| `/sustainability/` | Short hosting note. Nothing links to it. | **Cut** → 301 to `/colophon/`. Only `/carbon.txt` points at it, and that disclosure is optional. |
| `/tags/`, `/tags/<tag>/` | Tag index. No post has tags today. | **Cut** → 301 to `/articles/` |
| `/styleguide/` | Eleventy Excellent token showcase | **Cut** → 301 to `/` |
| `/feed.xml`, `/feed.json` | Atom and JSON feeds, posts only | Keep, posts only. Same URLs, same entry IDs. No second feed in this project. |
| `/sitemap.xml`, `/robots.txt`, `/humans.txt`, `/carbon.txt`, `/site.webmanifest`, `/404.html`, `/_redirects` | Plumbing | Keep |
| OG images (`/assets/og-images/*`) | SVG → PNG at build | Keep the pipeline. Restyle the templates in the last phase. |

### Features

| Feature | Call |
| --- | --- |
| Light / dark with a theme switch (`theme-toggle.js`, `data-theme`) | Keep the mechanism and storage key; restyle the control |
| Check-in day / night images (`checkin-figure.njk`) | Keep. Same partial, new CSS. |
| City map (`checkin-map.njk`, `checkin-cities.njk`) | Keep. Port the colours; keep PR 3's contrast and 44px targets. |
| Scheduled rebuild (`netlify/functions/checkin-rebuild.js`) | Keep, untouched |
| Lichess status pill (`lichess-status` function) | **Move** to the footer. Same function. Not in the header. |
| Field Notes link | Keep, in the footer |
| `stefan` pawn confetti, `/links/` Lichess egg | Keep. JS only, no theme ties. |
| "stefan is ___" cycling wordmark | **Cut** (decided) |
| Pixel night scene and horizon | **Cut** (decided) |
| Footer Rapid hit counter | **Cut** (decided). Chess numbers stay on `/chess/` and `/now/`. |
| Retro 2005 / 2006 skins | **Cut** (decided) |
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
- **RSS.** Posts only. `/feed.xml` and `/feed.json` keep their URLs, titles, and entry IDs, so no reader sees old posts as new. Check-ins and `/now` stay out of the feeds.
- **Secrets.** `CHECKIN_REBUILD_HOOK_URL`, `CHECKIN_MAP_EXCLUDE`, and any Lichess token are referred to by name only.

---

## The new home

1. **Intro.** Use this, exactly, and nothing else above the stream. No photo, no cycling verb, no CTA block.

   > Hey, I'm Stefan. I'm a veteran who builds backend systems and integrations, currently in the ServiceNow world, and I'm back in school. Right now I'm writing Ruby, running, playing chess, and planning our family's next move. This is where my posts, check-ins, and /now updates end up, newest first.

2. **Stream.** One newest-first list, built at build time from three collections. The newest 30 items. No pagination. If fewer than 30 are published, show all of them. The archives stay at `/articles/`, `/now/`, and `/checkins/`.

| Type | Source | Card |
| --- | --- | --- |
| Post | `collections.allPosts` | Title (link), date, `description` |
| Check-in | `collections.checkins` | Clay image (day / night pair via `checkin-figure.njk`, with its `alt`), the label, the one-line note, date. `precision: place` labels the place. `precision: city` labels the city only, never a place name. Links to `/checkins/#checkin-<hash>`. No image key → text-only card. |
| Now | `collections.nowEntries` | Date, the entry body (they are short), link to `/now/#now-YYYY-MM-DD` |

- Sort by the visible date. Check-ins sort by `date` (the visit day), never `publishAfter`.
- Each card says what it is in small text ("Post", "Checked in", "Now"), so a screen reader hears the type first.
- When the list is capped at 30, link to those three archives.

---

## Visual direction

- **Type.** Headings in Caveat, the hand face already self-hosted under `src/assets/fonts/caveat/` and already in the OG pipeline. Body and UI in `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. Code in `ui-monospace`. Caveat is headings only, subsetted, `font-display: swap`. Fraunces and Atkinson go away in the switch.
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
- **Nav.** Name on the left (links home). Header is three links: **Posts** (`/articles/`), **Check-ins**, **Now**. No drawer. Chess, Talks, Projects, Bookshelf, Resume, AI, Links, Field Notes, and the legal links sit in the footer, with the Lichess status. There is no About page; the intro on `/` is that.
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
- Copy: `docs/site-voice.md`. New labels are plain ("Checked in", "Older posts"). The homepage intro and the colophon paragraph are approved; paste them, don't paraphrase them.
- `npm run build` passes in every phase, including `npm run test:checkins`.
- No Lichess changes. If a page needs a new Lichess field, stop; see `.cursor/rules/chess-page.mdc`.

---

## Phase 1 — Skeleton at `/next/`

**Build:** `rasa.njk` with the header (name, plus Posts, Check-ins, Now) and a footer (Lichess status, Field Notes, feeds, the other page links, legal links, theme switch). No hit counter. `src/assets/css/rasa/site.css` with the palette, Caveat headings, `system-ui` body, and the column. `/next/` can be the intro alone; the stream arrives in Phase 2. No font specimen. Caveat is already on disk.

**Gotchas:** keep the theme switch's existing storage key and the inline script in `head/js-inline.njk`, or the choice is lost when the site switches. `noindex` on `/next/`. Exclude it from `showInSitemap` and the feeds.

**Done when**

- `/next/` renders in light and dark, at 1440 and 390, with no horizontal scroll.
- Every palette pair clears the contrast targets.
- Every other page's HTML is unchanged against `main`. `/next/` is not in `sitemap.xml`.

---

## Phase 2 — The stream on `/next/`

**Build:** the approved intro, verbatim, then a `homeStream` collection in `src/_config/collections.js` that merges `allPosts`, `nowEntries`, and `checkins` (from the filtered collection only), sorts newest first, and keeps 30. Card partials in `src/_includes/rasa/`: `card-post.njk`, `card-checkin.njk` (reuses `checkin-figure.njk`), `card-now.njk`. Add `id="now-YYYY-MM-DD"` to each entry on `/now/`. That is the one additive change to a live page.

**Tests:** extend the check-in fixture tests: a future `publishAfter` and a draft never appear in the stream, the stream HTML has no `lat`, `lon`, or coordinate-looking numbers, and a `precision: city` card shows the city only.

**Gotchas**

- Now-entry dates come from filenames (UTC midnight); check-in `date` is the local visit day; posts carry an offset. Compare by calendar day with `formatDateUtc`, or same-day items jump around.
- Use `checkinAnchor` for check-in links so no date ends up in a URL.
- `precision: city` has no `place` line. The card shows the city only, never a place name and never "City, Region". Same rule as the current check-in line and as the Phase 4 tile.
- The day/night switch for these cards lives in the rasa stylesheet: day image unless `data-theme` is `dark`. Don't change `checkin-figure.css`. That file still styles the live page. Phase 4 looks for the blue cast and keeps this rule.
- The 24 Sep `/now` entry has an image with `eleventy:widths`. It has to render through the image transform.

**Done when:** `/next/` shows the approved intro and the newest 30 published items, in order, with no second page. Check-in cards show the day image unless the theme is dark. The fixture tests pass. Live `/` is unchanged. The feeds are still posts only.

---

## Phase 3 — Posts, articles, and `/now`

**Build:** `rasa-post.njk` (title, date, prose, related reading). `rasa` CSS blocks for `/articles/` (plain dated list, same pagination URLs) and `/now/` (latest, "Previously…", chess stats table). Prose styles: headings in the hand face, code in `ui-monospace`, images and tables that don't overflow at 390.

**Gotchas:** syntax highlighting needs a small new theme that works in both modes; the old one lives in `local/syntax.css`.

**Done when:** with `TABULA_RASA=1`, every post, `/articles/`, `/articles/page-2/`, and `/now/` read well in both themes at 1440 and 390. Without the flag they match `main`.

---

## Phase 4 — Check-ins grid and chess

**Build**

- **Find the blue first.** Stefan says the check-in images all look weirdly blue. Before drawing the grid, find out where that comes from.
  - CSS: filters, blend modes, overlays, and the tile and page backgrounds. `src/assets/css/local/checkin-figure.css` does not filter or blend the images today. Confirm nothing else (`checkins.css`, the new tile fill, a parent) tints them. Remove any site-side tint. Don't add a filter to "correct" the color.
  - Which file is on screen. The inline theme script sets `data-theme` from `prefers-color-scheme` when nothing is stored, and `checkin-figure.css` then shows the night image. A dark OS preference is enough to make the first visit the night set. The grid shows the **day** image by default. The night image shows only when `data-theme` is `dark`.
  - Open a day file on its own, in light mode, with no page CSS. If that file is blue too, the color is in the WebP. This phase does not recolor it. Postcard regenerates the dioramas in true-to-place colors, one content PR per check-in, through `npm run checkins:images`, at the same spec (WebP, 1600×1067, q≈80, 250,000 bytes, no metadata). Not part of Phase 4.
- `/checkins/` in this order: the clay map, the city list, then a photo grid in place of the month timeline. Model is [melaniekat.com/pics](https://melaniekat.com/pics): a responsive grid, newest first, each cell one published check-in. Warm and playful, the kind of page a new visitor comes back to. Soft rounded tiles. A small hover lift. The same `checkin-figure.njk` partial as the home stream, so the day-by-default rule applies there too.
- A cell shows the clay diorama, the label, the date, and the one-line note. It keeps the existing `checkin-<hash>` id, so the home stream and the city list still land on it. No new permalinks. Check-ins have `permalink: false` and stay that way.
- **Label.** `precision: place` shows the place, then the city, as today's check-in line does. `precision: city` shows the city only. No place name, and no region. San Francisco is the example: the tile says San Francisco, not a venue.
- **Tile fill.** The clay images are cutouts on a transparent background. Each tile has its own solid background, from the warm palette, so the cutout isn't sitting on the page color and the page doesn't wash it blue. Light theme uses `--card` (`#ffffff`) on `--bg`. Dark theme uses `--card` (`#322d25`) on `--bg`. One fill per theme, shared by every tile. It has to read clearly behind the day image and behind the night image. No color from outside the six tokens, and no per-city color.
- **Playful, still accessible.** Soft rounded corners on the tile. A few pixels of lift on hover and on keyboard focus, with a visible focus ring that isn't the lift. `prefers-reduced-motion: reduce` drops the lift. Place and date are text, not only a tooltip. Contrast stays at the targets above.
- The grid can run wider than the 40rem reading column, so several dioramas sit on a row. One column at 390, more as it widens. Images stay 3:2. No horizontal scroll.
- A check-in with no `image` key is a text cell with the same words. Don't invent a picture.
- The grid reads `collections.checkins` only. Same `publishAfter` filter, same `CHECKIN_MAP_EXCLUDE` behaviour, same image spec, no coordinates in the captions or the markup.
- `/chess/` gets `rasa` CSS: scoreboard, games table that stacks under 40em, study embed.

**Gotchas**

- Dioramas only. Original photos are never in the repo, and this phase does not add a real-photo section.
- The map colours come from the palette tokens. Re-check PR 3 of `docs/checkins-map-project-plan.md`: amber rim on light land, gold on dark, 3:1 beads, 4.5:1 labels, 3px focus ring, 44px targets.
- Do not touch `src/_config/utils/checkin-map.js`, `cityCentroids.json`, the outline, or the check-in validator. CSS and the page template only.
- With `CHECKIN_MAP_EXCLUDE` missing locally, the city list is left out on purpose. The grid of non-excluded check-ins still has to respect the same filter. A missing variable is not a bug to "fix" by showing every city.
- Month headings go away. Don't sort the grid by city; the list above already does that.
- The transparent pixels are part of the WebP. Don't flatten them to white in the image pipeline. The tile CSS is the background.
- Don't edit files in `src/assets/images/checkins/` in this phase. A baked-in blue is postcard's content PR, not a CSS fix and not a one-off re-encode.
- Put the day-by-default rule in the rasa stylesheet. Don't edit `checkin-figure.css` in this phase. The live `/checkins/` page still includes it, and the live site has to keep matching `main` until Phase 6.

**Tests:** in the check-in fixture, a `precision: city` tile's text is the city and does not include a place name, and a `precision: place` tile still shows its place. A future `publishAfter` is absent from the grid.

**Done when:** with the flag, `/checkins/` shows the map, the city list, and a grid of every published diorama. With no theme stored, and in light mode, the day image is what shows, on the light tile fill, with no CSS tint. Dark mode (`data-theme='dark'`) shows the night image on the dark tile fill. Neither looks like it is floating. Tiles are rounded and lift a little on hover; with reduced motion they don't. A city-only tile shows the city and no place name. A future fixture check-in is absent. The page works from the keyboard and with JavaScript off, axe reports no violations, and `/chess/` has no sideways scroll at 390. Without the flag, both pages match `main`. If a day file is still blue with the page CSS removed, say so and leave the file for postcard.

---

## Phase 5 — Everything else

**Build:** `rasa` CSS for `/talks/` and the talk page, `/projects/`, `/bookshelf/`, `/resume/`, `/ai/`, `/links/`, `/privacy/`, `/accessibility/`, and `/404.html`. Restyle the OG SVG templates in Caveat. Replace the colophon body with this paragraph and nothing else. The title stays Colophon. Don't add links or a second paragraph.

> This site is built with Eleventy, started from the Eleventy Excellent starter, and hosted on Netlify. The code is public on GitHub. Headings are in Caveat, a free handwritten font. The check-in pictures are little clay scenes of each place, not my actual photos, and they only go up a day after I've left. The rebuild was inspired by Robb Knight's "Tabula Rasa" post and Melanie Kat's site, so if you like how this looks, go check out theirs.

**Gotchas:** `/links/` uses `compactHeader`; keep that flag working in `rasa.njk`. Leave `/talks/rubyconf-2026/slides/` alone.

**Done when:** with the flag, every page in `sitemap.xml` renders in both themes at 1440 and 390, the colophon body is that paragraph, and `npm run test:a11y` passes.

---

## Phase 6 — Switch over

**Build**

- Point the `base`, `page`, and `post` aliases at the new layouts for good. Remove the flag. Move the stream from `/next/` to `/`. Delete `/next/`.
- Add these 301s, through `redirectFrom` or static lines in `src/common/_redirects.njk`.

| From | To |
| --- | --- |
| `/tags/`, `/tags/*` | `/articles/` |
| `/styleguide/` | `/` |
| `/imprint/` | `/privacy/` |
| `/sustainability/` | `/colophon/` |

- Delete the page files for those cuts. In `src/_data/meta.js`, drop the `sustainability-page` disclosure so `/carbon.txt` doesn't point at a page that's gone. Keep `/carbon.txt` itself.
- Delete the old layouts, the `global` and `local` CSS, Tailwind and the token pipeline, Fraunces, Atkinson, the pixel scene, the "stefan is ___" script, the hit counter, and the retro skins. Keep Caveat. Grep before each deletion.
- Update `.cursor/rules/eleventy-excellent.mdc`, `docs/eleventy-excellent-reference.md`, and `AGENTS.md` to describe the new layout and CSS. The colophon body already landed in Phase 5.

**Gotchas**

- Diff the list of HTML paths in `dist/` against a build of `main`. Each missing path needs a 301.
- Diff `/feed.xml` and `/feed.json` against `main`. Entry IDs and URLs must match.
- Netlify caches `/assets/*` for a month. New CSS goes in the inline bundle or gets a new filename.

**Done when**

- `/` is the new home. No page uses the old theme.
- The URL diff is clean or fully redirected. The feeds diff shows no ID changes.
- A production build fails without `CHECKIN_MAP_EXCLUDE`, the same as today. `npm run build` and `npm run test:a11y` pass.

---

## Decisions (10 Oct 2026)

| Question | Call |
| --- | --- |
| Heading font | **Caveat.** Already self-hosted. Body and UI are `system-ui`. |
| Home length | Newest **30**. No pagination. Archives stay at `/articles/`, `/now/`, and `/checkins/`. |
| RSS | **Posts only.** `/feed.xml` and `/feed.json` stay as they are. |
| Homepage intro | Approved. Phase 2 uses the paragraph under "The new home", word for word. |
| `/checkins/` | A diorama grid, on the model of [melaniekat.com/pics](https://melaniekat.com/pics). Map and city list stay. No real photos. Day image by default; night only when the theme is dark. No site-side color tint. Warm rounded tiles with a small hover lift. Each tile has a palette fill behind the transparent cutout. A city-only check-in shows the city and no place name. |
| Lichess status | **Footer.** Same `lichess-status` function. Not in the header. |
| Cuts | **All of them.** `/tags/`, `/styleguide/`, the pixel scene, "stefan is ___", the hit counter, the retro skins, `/imprint/`, and `/sustainability/`. Nothing requires the last two: the email is already on other pages, and `/carbon.txt`'s sustainability disclosure is optional. Phase 6 adds the 301s. |
| Nav | **Posts, Check-ins, Now.** URLs stay `/articles/`, `/checkins/`, `/now/`. Everything else is in the footer. No About page. |
| Colophon | Approved. Phase 5 uses the paragraph in that phase, word for word. |

**Open decisions:** none.

---

## After it ships

Leave this file in `docs/`. Update **Status** at the top when each phase lands.
