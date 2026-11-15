# Speed and accessibility — Project plan

Fixes from the November 2026 performance and accessibility audit, one PR per phase.

**Status:** Phase 1 (responsive check-in images) done in #99, merged as `72bb196`. Stefan accepted the −43% `/checkins/` mobile transfer cut in place of the 60% target. Finding #3 (eager first tile) was dropped after review: in production no tile is above the fold. Phase 2 (script and accessibility fixes) in progress, approved 2026-11-15. Phases 3–5 not started. Phases 3 and 5 need Stefan's OK before they start.

**Outcome:** `/` and `/checkins/` stop shipping 1600px check-in images into 144px thumbnails, builds stop re-encoding images that haven't changed, and the small script, font, and accessibility gaps from the audit are closed. Every page keeps its content and looks the same unless a phase says otherwise and has a mockup.

**Cut**

- Removing, hiding, or shortening any content: no posts, check-ins, `/now` entries, images, or pages go away
- Re-encoding, renaming, or deleting the committed check-in WebPs in `src/assets/images/checkins/` (smaller sizes are build output only)
- New dependencies for any of this
- A click-to-load facade for the Lichess study unless chess traffic grows (#9 stays optional)
- Analytics or real-user monitoring

---

## Audit baseline

- **Commit audited:** `2a6bbb6`
- **Date:** 2026-11-15
- **Tools:** Node 22.15.1, Lighthouse 12.8.2 (run with `npx`, headless Chrome, default simulated throttling), pa11y-ci 4 (through `npm run test:a11y`)
- **How it was served:** `dist/` from a small local static server with gzip and Netlify-like cache headers. Production uses Brotli, so real transfer sizes are a little smaller than the ones below.

The site is already fast. Of the 16 Lighthouse runs, 14 score 100 for Performance, and every run scores 100 for Accessibility, Best Practices, and SEO. pa11y reports 0 errors on all 16 URLs. HTML is 8–12 KB gzipped, CSS is inlined, no JS is render-blocking, and the only third party is the Lichess study iframe on `/chess/`.

One real problem remains: **every check-in diorama image ships as a single 1600px file, even when it shows as a ~144px thumbnail.** That one bug accounts for nearly all the bytes on `/` and `/checkins/`, and for the only sub-100 scores. The second-biggest item is build time: about 80% of each build re-encodes images that haven't changed.

### Scores per page

Perf / A11y / Best Practices / SEO. LCP, CLS, TBT, and transfer size are from the same run.

| Page | Mode | Perf | A11y | BP | SEO | LCP | CLS | TBT | Transfer | Requests |
|---|---|---|---|---|---|---|---|---|---|---|
| `/` | mobile | **98** | 100 | 100 | 100 | **2.4 s** | 0 | 10 ms | **312 KiB** | 11 |
| `/` | desktop | 100 | 100 | 100 | 100 | 0.4 s | 0 | 0 ms | **429 KiB** | 13 |
| `/articles/` (posts index; there is no `/blog/`) | mobile | 100 | 100 | 100 | 100 | 1.5 s | 0 | 0 ms | 63 KiB | 7 |
| `/articles/` | desktop | 100 | 100 | 100 | 100 | 0.4 s | 0 | 0 ms | 63 KiB | 7 |
| `/articles/volunteering-at-rubyconf-before-i-felt-ready/` | mobile | 100 | 100 | 100 | 100 | 1.5 s | 0 | 0 ms | 65 KiB | 7 |
| same post | desktop | 100 | 100 | 100 | 100 | 0.4 s | 0 | 0 ms | 65 KiB | 7 |
| `/now/` | mobile | 100 | 100 | 100 | 100 | 1.5 s | 0 | 20 ms | 70 KiB | 7 |
| `/now/` | desktop | 100 | 100 | 100 | 100 | 0.3 s | 0 | 0 ms | 70 KiB | 7 |
| `/checkins/` | mobile | **99** | 100 | 100 | 100 | **2.0 s** | 0 | 0 ms | **593 KiB** | 16 |
| `/checkins/` | desktop | 100 | 100 | 100 | 100 | 0.4 s | 0 | 0 ms | **679 KiB** | 18 |
| `/chess/` (stands in for "one check-in page"; see note) | mobile | 100 | 100 | 100 | 100 | 1.5 s | 0 | 0 ms | 201 KiB | 38 |
| `/chess/` | desktop | 100 | 100 | 100 | 100 | 0.4 s | 0.023 | 0 ms | 201 KiB | 38 |
| `/projects/` | mobile | 100 | 100 | 100 | 100 | 1.5 s | 0 | 0 ms | 64 KiB | 7 |
| `/projects/` | desktop | 100 | 100 | 100 | 100 | 0.3 s | 0 | 0 ms | 64 KiB | 7 |
| `/privacy/` | mobile | 100 | 100 | 100 | 100 | 1.5 s | 0 | 0 ms | 63 KiB | 7 |
| `/privacy/` | desktop | 100 | 100 | 100 | 100 | 0.4 s | 0 | 0 ms | 63 KiB | 7 |

**The `/checkins/` rows are not production.** The audit built `dist/` without `CHECKIN_MAP_EXCLUDE`, and a build without it leaves out the city map and city list. In production those sit above the tiles. With the map present (CI's placeholder value), `/checkins/` measured mobile Perf 99, LCP 2.10 s, 381 KiB and desktop Perf 100, LCP 0.46 s, 687 KiB. The LCP element is the intro paragraph, not a tile. Phase 1 compares against those numbers.

**Note on "one check-in page":** check-ins have no pages of their own. `src/checkins/checkins.json` sets `permalink: false`, and each check-in is an anchor on `/checkins/`. `/chess/` was tested in that slot because it's the one page with a third-party embed.

### Top Lighthouse opportunities and diagnostics

| Page | Opportunity / diagnostic | Lighthouse estimate |
|---|---|---|
| `/` mobile | `uses-responsive-images` | 600 ms LCP, 240 KiB |
| `/` desktop | `uses-responsive-images` | 358 KiB |
| `/checkins/` mobile | `uses-responsive-images`, `lcp-lazy-loaded`, `lcp-discovery-insight` | 190 ms, 451 KiB |
| `/checkins/` desktop | `uses-responsive-images`, `lcp-lazy-loaded` | 583 KiB |
| `/chess/` | Lichess iframe loads in the first view on desktop (136 KiB from lichess.org, 31 of 38 requests). 0.021 layout shift on a `<p>`, most likely the Caveat font swap. | — |
| every page | `uses-long-cache-ttl`: flags only `/assets/scripts/components/custom-easteregg.js` (30 days) and Lichess's own assets | negligible |

### Build

| Measure | Value |
|---|---|
| `npm ci` | 6.7 s, 545 packages |
| `npm run build`, cold (Lichess cache empty) | **21.4 s** (Eleventy 18.7 s; `src/_data/lichess.js` alone is 7.7 s, 41%) |
| `npm run build`, warm (Lichess cached) | **13.6 s** (Eleventy 10.9 s) |
| `build:11ty` with `dist/` left in place (no `clean`) | **3.1 s** (Eleventy 2.2 s, "70 images optimized (69 cached)") |
| `test:checkins` (runs first in `build`) | 1.2 s, 45 passing |
| `dist/` total | **15 MB**, 219 files |

The gap between 13.6 s and 3.1 s is image re-encoding. `npm run clean` deletes `dist/`, so eleventy-img has nothing to reuse and re-encodes every AVIF, WebP, and JPEG on every build, both locally and on Netlify.

**Largest files by type in `dist/`**

| Type | Files | Total | Largest |
|---|---|---|---|
| HTML | 24 | 610 KiB | `talks/rubyconf-2026/slides/index.html` 42.7 KB; `index.html` 41.7 KB (9.4 KB gzipped); `now/` 38 KB; `chess/` 36.9 KB |
| CSS | 1 file + inline | 2.7 KiB file | `assets/components/lite-yt-embed.css`. Site CSS is inlined: 0.6–6.7 KB per bucket after cssnano. |
| JS | 4 files + inline | 40.6 KiB | `custom-links-egg.js` 14.4 KB, `custom-easteregg.js` 11.9 KB, `lite-yt-embed.js` 10.6 KB, `is-land.js` 4.6 KB. `/chess/` inlines about 14 KB of script and JSON. |
| JPEG | 54 | 6.8 MiB | `talks/rubyconf-2026/slides/assets/volunteer-hands-on.jpg` 519 KB; `taitano-times-…-2550w.jpeg` 335 KB; `template/opengraph-default.jpg` 326 KB; check-in fallbacks `img/*-1600.jpeg` 150–270 KB each |
| WebP | 46 | 3.8 MiB | check-ins `img/*-1600.webp` up to 246 KB |
| AVIF | 46 | 2.0 MiB | check-ins `img/*-1600.avif` 34–107 KB |
| PNG | 16 | 691 KiB | `assets/images/stefan.png` 110 KB, OG PNGs |
| Fonts | 5 | 128 KiB | `caveat-latin-600.woff2` **51.3 KB** (preloaded on every page); the other four belong to the slides deck only |

### pa11y (`npm run test:a11y`)

16/16 URLs, 0 errors each: `/`, `/now/`, `/chess/`, `/articles/`, `/talks/`, `/talks/rubyconf-2026/`, `/talks/rubyconf-2026/slides/`, `/projects/`, `/ai/`, `/bookshelf/`, `/resume/`, `/links/`, `/checkins/`, `/colophon/`, `/accessibility/`, `/privacy/`. No individual article page is in the list, which is how finding #6 slipped through.

---

## This repo (already in place)

| What | Where |
| --- | --- |
| Check-in figure (day + night `<img>`) | `src/_includes/partials/checkin-figure.njk` |
| Home stream check-in card | `src/_includes/rasa/card-checkin.njk` |
| `/checkins/` tiles | `src/_includes/rasa/checkin-tiles.njk` |
| Card and thumbnail CSS | `src/assets/css/rasa/site.css` (`.rasa-card--checkin`) |
| Tile CSS | `src/assets/css/rasa/checkins.css` (`.rasa-tiles__list`, `.rasa-tile`) |
| Image transform config | `eleventy.config.js` (`eleventyImageTransformPlugin`) |
| Committed check-in images and checks | `src/assets/images/checkins/`, `npm run checkins:images -- --check` |
| Head scripts | `src/_includes/head/js-inline.njk`, `src/assets/scripts/bundle/` |
| Font preload | `src/_layouts/rasa.njk` |
| pa11y paths | `src/_data/meta.js` (`meta.tests.pa11y.customPaths`) |
| Headers and cache | `netlify.toml` |

Extend these. Don't add a second image pipeline, a second layout, or a second CSS system.

---

## Standing rules

- One phase per PR, one phase per session. Don't start the next phase until Stefan says so.
- No content removed. Images look the same unless a phase says otherwise and has a mockup.
- Never change, re-encode, rename, or delete a committed check-in WebP. Responsive sizes are build output only.
- Don't touch the `publishAfter` gate, the rebuild hook, `CHECKIN_MAP_EXCLUDE` handling, `package.json`, the lockfile, workflows, `netlify.toml`, or headers unless the phase says so and Stefan has OK'd it. Never print `CHECKIN_REBUILD_HOOK_URL` or `CHECKIN_MAP_EXCLUDE`.
- Measure before and after with the same setup: Lighthouse 12.8.2 mobile and desktop on a served `dist/` built with CI's placeholder `CHECKIN_MAP_EXCLUDE` (read from the workflow file, never printed) so `/checkins/` matches production, or on the PR's deploy preview. Simulated LCP moves run to run, so take the median of three runs.
- Every phase that touches templates, CSS, scripts, or config gets the single pre-merge review pass in `AGENTS.md`, including the security pass.

---

## Findings, ranked by impact

**Needs Stefan's OK** means the fix touches `package.json` or the lockfile, build/deploy config, or security headers.

### 1. Check-in images ship only a 1600px file, even as ~144px thumbnails

- **What:** `src/_includes/partials/checkin-figure.njk:11` puts `width="1600"` on each `<img>`. In eleventy-img 6, a plain `width` attribute overrides the configured widths and produces exactly one width (`node_modules/@11ty/eleventy-img/src/image-attrs-to-posthtml-node.js:77-79`). The `widths: [400, 800, 1200, 'auto']` in `eleventy.config.js:87` never apply, so each `srcset` has one candidate: `/img/…-1600.avif 1600w`. The partial's `sizes` (`(min-width: 40em) 34rem, 100vw`) is also wrong in both places it's used. The home thumbnail is `clamp(6.5rem, 28vw, 9rem)` wide, and `/checkins/` tiles are about 16–22rem.
- **Evidence:** All 44 `srcset`s on `/` and `/checkins/` have one candidate. Lighthouse `uses-responsive-images` estimates 240–358 KiB wasted on `/` and 451–583 KiB on `/checkins/`, and lists the largest offender as `c9Lt9lgy50-1600.avif` (95 KiB, 93 KiB wasted). A test encode of the 11 day images: **1600w AVIF 685 KiB, 800w 307 KiB, 480w 153 KiB** in total.
- **Fix:** Remove `width="1600"` and add `eleventy:widths`. The transform puts `width` and `height` back from the output metadata, so CLS stays 0. Pass `sizes` from each caller. Keep `loading="lazy"`. The day/night `display: none` trick still works.
- **Effort / risk:** S / low. Template-only. **Needs Stefan's OK:** no.

### 2. Every build re-encodes all images (~8.7 s of the ~11 s Eleventy time)

- **What:** `package.json` `clean` runs `rimraf dist …`, and eleventy-img writes to `./dist/img/` (`eleventy.config.js`) and `./dist/assets/images/` (the `image` shortcode). The disk cache works by checking whether the output file exists, so after a clean it always misses. Netlify caches only `.cache` (`netlify.toml`, `netlify-plugin-cache`).
- **Evidence:** A warm `npm run build` takes 10.9 s in Eleventy. The same build without `clean` takes 2.2 s and reports "70 images optimized (69 cached)".
- **Fix:** Point eleventy-img's `outputDir` at `.cache/img` (already restored on Netlify) and copy it to `/img/` with a passthrough. Do the same for the shortcode's `./dist/assets/images/`. Another option is to leave `dist/img` out of `clean` and add it to the cache plugin's `paths`, but that changes `package.json` and `netlify.toml`.
- **Estimated gain:** About 8–9 s per local build, likely more on Netlify. Visitors see no change.
- **Effort / risk:** S–M / low–medium. `.cache/img` will grow over time unless something prunes it. **Needs Stefan's OK:** **yes**.

### 3. `/checkins/` LCP is a lazy-loaded image — **dropped**

- **What the audit saw:** The first tile was the LCP element but had `loading="lazy"`, so the browser found it late (`lcp-lazy-loaded`, `lcp-discovery-insight`).
- **Why it's dropped:** That came from a build without the city map. In production the map (about 685px) and the city list (about 417px) come first, so the first tile starts about 1635px down at 1440×900 and about 1820px down at 390×844. With the map present, the LCP element is the intro paragraph. Making the first tile eager would only fetch two offscreen images (day and night, since `display: none` doesn't stop an eager fetch) at high priority on every visit. Phase 1 tried it, and the review caught it.
- **If it comes back:** only with a measurement on the real page that shows a tile is the LCP element.

### 4. Caveat font: 51 KB preloaded on every page, and a small swap shift

- **What:** `src/_layouts/rasa.njk:16` preloads `caveat-latin-600.woff2` (51,296 bytes) with `crossorigin` and `font-display: swap`. The fallback is generic `cursive` (`site.css:17`), which is Comic Sans on Windows and has very different metrics, so the swap moves text.
- **Evidence:** A 0.021 layout shift on a `<p>` on `/chess/` desktop. The file is the second-largest critical-path resource after the HTML.
- **Fix:** (a) Subset the font to the characters headings use (Basic Latin, curly quotes, dashes, é), offline, committing only the new `.woff2`. Estimated 25–35 KB; measure it. (b) Add a metric-matched fallback `@font-face` (`size-adjust`, `ascent-override`).
- **Effort / risk:** M / medium. A missing glyph would fall back to `cursive`, so check every heading, the OG images (they use `src/_config/og-fonts/*.ttf`, untouched), and the slides. **Needs Stefan's OK:** yes under the design-first rule.

### 5. The Lichess status script runs in `<head>` and calls a function on every page view

- **What:** `src/_includes/head/js-inline.njk:6` inlines `lichess-status.js` into a classic `<script>` in `<head>` on every page, which fetches `/.netlify/functions/lichess-status` on every load. The function returns `Cache-Control: public, max-age=30`.
- **Fix:** Keep `theme-toggle.js` in the head. Move `lichess-status.js` into the `defer` module bundle and start the fetch in `requestIdleCallback`.
- **Effort / risk:** S / low. **Needs Stefan's OK:** no for moving the script; yes for any function cache-header change.

### 6. Accessibility: heading levels skip in two posts

- **What:** `src/posts/2026-02-17-de-googling-family-digital-life.md` uses `###` under the h1 (h1 → h3). `src/posts/2023-11-01-military-transition-into-servicenow-skillbridge.md` uses `####` (h1 → h4).
- **Fix:** Change these to `##`. Text stays the same; only the level changes. Add one or two article URLs to the pa11y paths with `pa11yRunners: ['htmlcs', 'axe']` so axe's `heading-order` check covers posts.
- **Effort / risk:** S / low. **Needs Stefan's OK:** no. The posts keep their voice; this is markup only.

### 7. The theme-color meta is inverted after JS runs

- **What:** `src/assets/scripts/bundle/theme-toggle.js:2-5` maps `dark: '{{ meta.themeLight }}'` and `light: '{{ meta.themeDark }}'`. In dark mode, mobile browser chrome turns cream over a dark page. `meta.themeDark` (`#322d25`) is also `--card`, not the dark `--bg` (`#19150e`).
- **Fix:** Swap the mapping and set `themeDark` to `#19150e`.
- **Effort / risk:** S / low. **Needs Stefan's OK:** no.

### 8. Reduced motion: the confetti easter egg ignores it

- **What:** `src/assets/scripts/components/custom-easteregg.js:47` calls `confetti({...})` without `disableForReducedMotion: true`. Everything else already respects the setting.
- **Fix:** Add `disableForReducedMotion: true`.
- **Effort / risk:** S / none. **Needs Stefan's OK:** no.

### 9. Lichess study iframe loads in the first view on desktop

- **What:** `/chess/` has `loading="lazy"` on the iframe, but on desktop it's close enough to the viewport that Chrome loads it right away: 136 KiB and 31 requests to lichess.org. Perf is still 100 and TBT is 0.
- **Fix (optional):** A click-to-load facade. Not recommended unless chess traffic grows.
- **Effort / risk:** M / medium (adds an interaction step; needs a mockup).

### 10. Cache TTL on unhashed component JS

- **What:** `/assets/scripts/components/*.js` gets 30 days (`netlify.toml`, `/assets/*`), the only first-party item Lighthouse flags.
- **Fix:** Optional. Content-hash the component filenames in `src/_config/events/build-js.js` and serve them from `/bundle/` (already `immutable`).
- **Effort / risk:** S–M / low. **Needs Stefan's OK:** yes if headers change; no if only filenames move.

### 11. Security headers (no speed impact)

- **What:** `X-XSS-Protection: 1; mode=block` (`netlify.toml`) is deprecated; current advice is `0` or dropping it. The CSP is only `upgrade-insecure-requests`, so it doesn't restrict scripts.
- **Fix:** Set `X-XSS-Protection: 0`. A real CSP is a larger job (build-time hashes for inline scripts and styles, `frame-src` for Lichess and YouTube, `connect-src` for the compare feature). Start with `Content-Security-Policy-Report-Only`.
- **Effort / risk:** S for the XSS header; L / medium for CSP. **Needs Stefan's OK:** **yes**.

### Already good (no action)

- **Render-blocking:** none. CSS is inlined per page, scripts are modules or deferred, and the easter egg loads in `requestIdleCallback`.
- **Unused CSS/JS:** Lighthouse flags none.
- **Images outside check-ins:** `/now/`, `/links/`, `/ai/`, and posts already have real `srcset`s, `width`/`height`, and lazy loading. The `/links/` avatar is eager with `fetchpriority="high"`.
- **Third parties:** no analytics, no external fonts, no external scripts. Lichess (iframe) and YouTube (`lite-youtube` facade) only.
- **Skip link, landmarks, focus styles, link text, form labels, theme flash:** all fine.
- **Colour contrast:** everything passes AA in both themes. `--rule` is decorative only.
- **Image alt text:** every `<img>` has `alt`.
- **Minor:** two `target="_blank"` links on `/resume/` don't say they open a new tab (picked up in Phase 2).

---

## Phases

Each phase is one PR and ships on its own. Phase 5 is stretch.

### Phase 1 — Responsive check-in images (#1) — **Done** (#99, `72bb196`)

**Build**

- `checkin-figure.njk`: drop `width="1600"` and `height="1067"`, add `eleventy:widths="320,480,800,1200"`, and take `sizes` (`figureSizes`) from the caller. eleventy-img writes `width="1200" height="800"` back from its output, which is the same 3:2 box. Both variants stay `loading="lazy"`.
- `card-checkin.njk` (home stream): `sizes="(min-width: 32.2rem) 9rem, (min-width: 23.2rem) 28vw, 6.5rem"`, matching `clamp(6.5rem, 28vw, 9rem)`.
- `checkin-tiles.njk` (`/checkins/`): `sizes="(min-width: 74.5rem) 21.7rem, (min-width: 59rem) calc(33.33vw - 3.1rem), (min-width: 39.75rem) calc(50vw - 3.3rem), calc(100vw - 3.9rem)"`. This comes from `main` (`min(100vw - 2.5rem, 72rem)`), the `minmax(18rem, 1fr)` grid with a 1.25rem gap, and the tile's 0.75rem padding and 1px border. Each value comes out a pixel or two over the real slot, never under.
- Alt stays on each `<img>` from `image.alt`. The hidden variant is `display: none`, so it's out of the accessibility tree and the alt isn't read twice.

**Verify first:** every `srcset` on `/` and `/checkins/` has four candidates, `sizes` matches the caller, `width`/`height` are present, and every check-in `<img>` is lazy (no `fetchpriority`).

**Gotchas**

- A plain numeric `width` on an `<img>` overrides `eleventy:widths`. Don't add it back.
- Keep every check-in image lazy. An eager image downloads even when `display: none`, so the hidden day or night variant would be fetched too. The `site.css` comment depends on this.
- Build with CI's placeholder `CHECKIN_MAP_EXCLUDE` before measuring `/checkins/`. Without it the map and city list drop out, the tiles move to the top, and the numbers stop matching production. That's how finding #3 went wrong.
- `npm run smoke` also needs that placeholder, or its map test fails on a local build.

**Done when** `/` mobile Perf is 100, `/` and `/checkins/` transfer is down by at least 60%, CLS stays 0, the images look the same, and `npm run checkins:images -- --check` passes.

**Result (2026-11-15).** Lighthouse 12.8.2 on a local `dist/` built with CI's placeholder `CHECKIN_MAP_EXCLUDE`, so the map renders. Before is the `2a6bbb6` templates; after is this phase. Perf scores are 3 runs; LCP and transfer are medians of 3.

| Page | Mode | Perf before → after | LCP before → after | Transfer before → after |
|---|---|---|---|---|
| `/` | mobile | 98/100/100 → 100/100/100 | 1.80 s → 1.50 s | 312 → 101 KiB (−68%) |
| `/` | desktop | 100 → 100 | 0.58 s → 0.40 s | 429 → 117 KiB (−73%) |
| `/checkins/` | mobile | 99 → 99 | 2.10 s → 2.03 s | 381 → 218 KiB (**−43%**) |
| `/checkins/` | desktop | 100 → 100 | 0.46 s → 0.46 s | 687 → 228 KiB (−67%) |

CLS is 0 in every run. Accessibility is 100 in every run.

**`/checkins/` mobile misses the 60% target (−43%).** With the map present, the phone loads only the first five tiles' images (the lazy-load margin). Each tile is full width on a 412px, 1.75× screen, so the browser correctly picks the 800w files. Lighthouse estimates 31 KiB left to save. Getting under 60% would mean lower image quality or fewer images, which this plan rules out. **Stefan accepted the −43% result on 2026-11-15**, so phase 1 is done with that number.

**`/checkins/` mobile stays at 99, and images aren't why.** The LCP element is the intro paragraph (TTFB about 450 ms, render delay about 1.6 s, no image in the path). That's worth a look in a later phase, not this one.

### Phase 2 — Small script and accessibility fixes (#5, #6, #7, #8, `/resume/` new-tab cue) — **in progress**

**Build:** Move `lichess-status` out of the head into the deferred bundle, fix the theme-color swap, add `disableForReducedMotion`, fix the heading levels in the two posts, add a visually hidden "(opens in new tab)" on the two `/resume/` links, and add one article to the pa11y paths with axe.

**Verify first:** the footer Lichess badge still shows online and playing states; mobile toolbar colour matches the page in both themes.

**Gotchas:** `theme-toggle.js` must stay in the head or the theme flashes. The posts' text stays exactly as written.

**Done when** pa11y (htmlcs and axe) passes with an article in the list, the two posts' headings are screenshotted before and after, and nothing else visibly changes.

**Found while building.** axe runs only on the article paths (`meta.tests.pa11y.axePaths`) and on `/checkins/` (its own front matter). With axe on every path, 5 of 18 URLs fail on contrast issues that predate this phase: the `aria-hidden` arrows on `/` (17) and `/ai/` (7), the back arrow on `/links/`, the chart axis labels and the Lichess iframe ("frames should be tested") on `/chess/`, and red title text on the slides. Fixing them changes CSS, so they wait for a later phase with a mockup. pa11y's axe runner reports `heading-order` as a warning, not an error, so a new skipped heading level shows in the log but doesn't fail CI.

### Phase 3 — Build image cache (#2) — **needs Stefan's OK**

**Build:** Move eleventy-img output to `.cache/img` and pass it through to `/img/`; do the same for the shortcode output.

**Verify first:** `.cache` is what `netlify-plugin-cache` restores.

**Gotchas:** `.cache/img` grows; plan a prune. Hashed filenames make stale output unlikely but check the deploy preview's images.

**Done when** a warm `npm run build` is about 5 s and a Netlify deploy log shows "(N cached)" close to N.

### Phase 4 — Font subset and fallback metrics (#4) — **mockup first**

**Build:** Commit a subset Caveat `.woff2` under a new filename (the font cache is `immutable`) and add a `size-adjust` fallback `@font-face`.

**Gotchas:** Check every heading, the slides deck, and the OG images for missing glyphs.

**Done when** every page's headings render the same in before/after screenshots and `/chess/` CLS is 0.

### Phase 5 — Security headers and hashed components (#11, #10) — **needs Stefan's OK, stretch**

**Build:** Set `X-XSS-Protection: 0`, ship a CSP as Report-Only, and move component JS to `/bundle/` with hashes. A Lichess click-to-load facade (#9) could come later if wanted.

**Done when** the deploy preview's headers show the change, the Report-Only CSP logs no violations on the pa11y pages, and nothing visibly changes.
