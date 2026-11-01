# Homepage bento — Project plan

A "What I'm building" grid on the homepage. Four tiles. One of them moves. The rest hold still.

**Status:** Phase 0 is the sample on this branch. `/lab/bento/` shows the grid. The live homepage is unchanged. Phases 1–4 have not started.

**Outcome:** Under the homepage intro, a bento of what Stefan is building: Field Notes, the family frame, the boot.dev path, and the latest check-in. A visitor sees one picture made of four tiles, with one short loop on Field Notes and a still everywhere else, including when they prefer reduced motion.

**Cut**

- React, the Stageshow kit, or any other client framework in this repo
- A second layout, a token pipeline, or Tailwind
- Rewriting the homepage stream, the header, or the footer
- Voice copy written by the agent. Tile wording comes from Stefan's writer
- Family photos, names, or family data, in a tile or in an asset
- Anything from Field Notes #002 beyond the name. No topic, excerpt, body, or detail
- Coordinates, trailheads, parking, addresses, or directions
- A video on more than one tile
- The colophon credit in Phase 0 (it lands with the homepage, in Phase 4)
- Reading or printing `CHECKIN_MAP_EXCLUDE` or `CHECKIN_REBUILD_HOOK_URL`

---

## Attribution

The product pictures are filmed with [Stageshow](https://github.com/benjitaylor/skills/tree/main/stageshow) by Benji Taylor. Stageshow is MIT licensed. Copyright (c) 2026 Benji Taylor. The license text is in that repo's `LICENSE`.

The kit stays out of this repo. A tile is filmed in a throwaway checkout and committed as a still (WebP and AVIF) and, for the one lead tile, a short muted loop (WebM and MP4). Phase 4 adds one line to the colophon. This phase does not.

---

## This repo (already in place)

| What | Where |
| --- | --- |
| Homepage | `src/pages/index.njk` includes `src/_includes/rasa/home.njk` |
| Intro, then the stream | `home.njk`: the intro, the link line, then `collections.homeStream` |
| Layout | `base` → `src/_layouts/rasa.njk`. Header, footer, and `main` stay as they are |
| Column | `--column` is `40rem`, set on `main` in `src/assets/css/rasa/site.css` |
| CSS | Plain CSS in `src/assets/css/rasa/`, inlined with `{% css "rasa" %}` |
| Colors | `--bg`, `--text`, `--muted`, `--rule`, `--accent`, `--card` |
| Images | The Eleventy image transform writes `/img/` from a normal `<img>`. Art-directed crops skip it with `eleventy:ignore` and are copied through |
| Sitemap | `collections.showInSitemap` in `src/_config/collections.js`, plus `excludeFromSitemap` in `src/common/sitemap.njk` |
| Feeds | `src/common/feed-atom.njk` and `feed-json.njk` list `collections.posts` only |
| Nav | Header is Posts, Check-ins, Now. Footer pages are the list in `src/_includes/rasa/footer.njk` |
| Autoplay | `netlify.toml` sets `Permissions-Policy: autoplay=()` on `/*`, which blocks a loop |
| Copy | `docs/site-voice.md` |
| Colophon | `src/pages/colophon.md` |

Extend `home.njk` and add one CSS file. Do not add a second homepage.

---

## Standing rules

- One phase per session. Stop until Stefan says next phase.
- Fit this repo. Input `src/`, output `dist/`. No React in the site. Stageshow is a filming tool, not a dependency.
- No voice copy. Labels in the sample are the plain names, each marked `placeholder copy`. The writer replaces them.
- Places only, on the check-in tile, and only once that tile is real. No people. No coordinates.
- Field Notes #002 does not publish until Monday 2 Nov 2026, 8:00 AM CT (`2026-11-02T08:00:00-06:00`; daylight saving ends the day before). Deploy previews are public. Until that time, the tile may say `Field Notes #002` and a generic new-issue line. It may not link to the issue, and it may not carry a topic, excerpt, body, or any other detail from it.
- The family frame tile stays generic until Stefan says what it may show. No photo of a person, no name, no family data.
- Do not invent a boot.dev number or path name. The stat is a figure Stefan supplies.
- Bitmaps do not follow the six color tokens. Film a light still and a dark still before the tile is asked to flip with the theme.
- Netlify caches `/assets/*` for a month. A changed picture needs a new filename.
- Do not read, log, or commit `CHECKIN_MAP_EXCLUDE` or `CHECKIN_REBUILD_HOOK_URL`.

---

## The grid

One picture, four tiles. Not four demos. Field Notes is the only window. The other three are other kinds, so the grid is not a row of cropped apps.

| Tile | Desktop | Mobile | Kind | The one thing | Words in this sample |
| --- | --- | --- | --- | --- | --- |
| Field Notes | Left, about 1.45fr, two rows tall | First | Hero UI | An inbox, and one new issue arriving | Label `Field Notes`. Inside the picture: `Inbox`, `Field Notes #002`, `New issue` |
| family frame dashboard | Right, top | Second | One component, later | A single dashboard widget, no window chrome | The plain name. No picture yet |
| boot.dev path progress | Right, under the family frame | Third | Stat, later | One progress figure | The plain name. No number yet |
| latest check-in | Full width, under the rest | Fourth | Photo or object, later | The newest published check-in | The plain name. No place yet |

Check against the Stageshow bento rules: one tile is UI with a window (the hero). The other three are not windows. The hero is the big tile. No real string repeats. The check-in does not sit beside another window. Motion has one place to lead.

**Desktop, from `40rem` (640px) up.** A two-column grid, `1.45fr` and `1fr`, gap `0.75rem`, shared radius `0.75rem`. Field Notes occupies the left cell and both rows. The family frame and boot.dev stack on the right. The check-in is a full-width band under them, shorter than the hero. The grid's container is `min(60rem, 100% - 2.5rem)`, wider than `--column`, centered. On the homepage the intro and the stream stay in `--column`. Only the grid breaks out.

**Mobile, under `40rem`.** One column. Order: Field Notes, family frame dashboard, boot.dev path progress, latest check-in. The hero still swaps to a compact crop filmed at the phone width, so the type is not a shrunk desktop picture. The loop does not play here.

Copy sits under the picture on the hero, and at the bottom of each placeholder, in the body face at about 18px. `placeholder copy` is a visible marker, uppercase, in `--muted`. Caveat stays on the page headings.

---

## How it renders

Stageshow is React. This site does not take React. The page is Nunjucks, the CSS is the `rasa` bundle, and the pictures are files.

1. Film the tile outside the repo with the Stageshow kit (`Stage`, `Window`, `Row`, `Collapse`, `Bar`, `Text`). Design the wide stage at the size the desktop tile shows (560×340) and a compact stage for the phone (340×300). The poster frame is the arrived issue, which is also the reduced-motion still.
2. Commit a wide still and a compact still, each as WebP and AVIF. Commit one muted loop, WebM and MP4, about four seconds, no audio. Nothing else from the kit.
3. The page uses `<picture>` to swap the still at `40rem`. `eleventy:ignore` keeps the image transform from replacing that art direction. Passthrough copy serves the files from `/assets/`.
4. The loop sits on top of the wide still. Its `<source>` elements start as `data-src`. A small inline script gives them a `src` only when all three are true: the shot is near the viewport, the viewport is at least `40rem`, and `prefers-reduced-motion` is not `reduce`. Then it plays. If any check fails, or `play()` is rejected, the still stays. With scripting off, the sources are never set, so the file is not downloaded.
5. CSS hides the video under `40rem` and under `prefers-reduced-motion: reduce`.
6. The Field Notes still is the sample page's largest paint. It is not `loading="lazy"`. It uses `fetchpriority="high"`. `loading="lazy"` on `<video>` is not baseline, so the script is the deferral.

The site-wide `Permissions-Policy` is `autoplay=()`, which blocks the loop on Netlify even when the script calls `play()`. `/lab/*` allows `autoplay=(self)` and sends `X-Robots-Tag: noindex, nofollow`. Phase 4 has to allow `autoplay=(self)` on the homepage too, or the loop will sit on the still.

Phase 0 files:

| What | Where |
| --- | --- |
| Sample page | `src/pages/lab/bento.njk` → `/lab/bento/` |
| CSS | `src/assets/css/rasa/bento.css`, inlined on that page only |
| Stills | `src/assets/images/bento/field-notes-wide.webp` and `.avif`, `field-notes-compact.webp` and `.avif` |
| Loop | `src/assets/video/bento/field-notes.webm` and `.mp4` |
| Copy | `eleventy.config.js` passthrough for those two folders |
| Headers | `netlify.toml`, `/lab/*` only |

`/lab/bento/` sets `robots: noindex, nofollow`, `eleventyExcludeFromCollections: true`, and `excludeFromSitemap: true`. It is not in the header, the footer, the feeds, or the sitemap. The homepage template is not edited.

The picture's only words are `Inbox`, `Field Notes #002`, and `New issue`. The other rows are blank bars. The accent in the film is the site's light-mode amber (`#b45309`). The sample is the light film in both themes. A dark film is later, if the tile should follow the theme switch the way check-in photos do.

---

## Phase 0 — Plan and hidden sample

**Build**

- This plan.
- `/lab/bento/`, noindex, out of the sitemap, the feeds, and the nav.
- One filmed Field Notes tile (wide still, compact still, one loop) and three labeled placeholder boxes.
- Do not change `src/pages/index.njk` or `src/_includes/rasa/home.njk`.

**Endpoints:** none.

**Verify first:** none.

**Gotchas**

- A preview URL is public the moment the PR exists. The sample must already be free of issue #002's contents.
- `autoplay=()` on `/*` would make the loop look broken on the preview. The `/lab/*` header is the exception.
- `main` is `40rem`. The sample widens `main` only on this page, with `main:has(.bento-sample)`. The homepage must not widen the intro with it.
- The image transform will rewrite an `<img>` that is missing `eleventy:ignore` and drop the `<picture>` art direction.
- The compact still is its own crop. Do not scale the wide still down to 390px. The type becomes unreadably small.

**Done when**

- `/lab/bento/` shows the four-tile grid at 1440 and at 390.
- The homepage HTML is unchanged.
- `/sitemap.xml` and both feeds do not list `/lab/bento/`.
- The header and footer do not link to it.
- The page sends `noindex`.
- `npm run build` passes.
- The Field Notes still is the thing you see with reduced motion, with scripting off, and under 40rem.

---

## Phase 1 — Revise the Field Notes picture

**Build:** Stefan looks at `/lab/bento/` and says what to change in the crop, the loop, and the three strings. Refilm. Still no issue body, still no homepage, still no link to the issue before `2026-11-02T08:00:00-06:00`.

**Gotchas:** A new file needs a new filename, because `/assets/*` is cached for a month. Do not loosen the spoiler rule to make the tile more specific.

**Done when:** Stefan says the picture is the one to keep, and the sample page shows that film.

---

## Phase 2 — Words

**Build:** Replace `What I'm building`, the four labels, and the `placeholder copy` markers with the lines the writer supplies. Do not draft them in the agent session. If a line is missing, leave the marker.

**Gotchas:** `docs/site-voice.md`. One to four words, or one sentence. No paragraph, no bullet list. The words inside the filmed picture are part of the picture; changing them means a new film, not a CSS edit.

**Done when:** The sample shows the writer's lines, and no `placeholder copy` marker remains on a tile that has them.

---

## Phase 3 — The other three pictures

**Build:** One still each. No new video.

- Family frame: one component, cropped, no window chrome. Stefan says what may be drawn. No photo of a person, no name, no family data.
- boot.dev: one number he supplies, large, with the unit on the same line. Do not invent the figure.
- Latest check-in: the newest published check-in's existing day and night image, or a still of that card. No new place, no coordinates. A town that is home-area stays at `precision: city` and does not get a closer picture here.

**Gotchas:** Check-in images already on the site are the clay scenes, not snapshots of people. Do not add a new photo pipeline. The check-in tile follows publish rules in `.cursor/rules/checkins.mdc`: nothing on the site before `publishAfter`.

**Done when:** Each of the three tiles has its still, the hero is still the only window, and the grid still reads as one picture at 1440 and at 390.

---

## Phase 4 — Homepage

**Build**

- In `home.njk`, after the link line and before the stream, include the grid. The intro stays in `--column`. The grid uses the wider measure from Phase 0.
- Allow `autoplay=(self)` on the homepage response, or the loop will not play. Keep every other `Permissions-Policy` feature closed.
- Add the Stageshow credit to `src/pages/colophon.md`: Stageshow by Benji Taylor, MIT, with the repo link.
- Remove `/lab/bento/` so the hidden URL is not a second homepage.
- Film the dark still if the hero should follow the theme switch.

**Gotchas:** Merging to `main` deploys. Do not merge while the Field Notes tile still carries anything #002 must not show, and do not merge a link to that issue before `2026-11-02T08:00:00-06:00`. The homepage is cached like the rest of the site; there is no scheduled rebuild.

**Done when:** `/` shows the grid in both themes at 1440 and 390, reduced motion shows stills, the colophon names Stageshow, `/lab/bento/` is gone, and the stream below the grid is the same stream as before.

---

## Shippable on its own

Phase 0 is the review sample. It is not the homepage. Phases 1–3 stay on the hidden page. Phase 4 is the one that changes `/`.
