# Homepage C + chess — Project plan

Ship the margin-notes homepage (option C) and, in a later phase, a quieter chess page. One visible slice per session.

**Status:** Phase 1 and Phase 2 landed. This project is done. Articles, projects, bookshelf, talks, and `/now` were not in it; see “After this project.”

**Outcome:** The homepage reads like the Home C mock: a cycling “stefan is ___”, the systems line, a short bio, live Rapid on the page, and hairline rows. `/chess/` kept its sections and got smaller headings and a phone-friendly games table (option 3). Nav stays Now / Articles / Talks / Projects.

**Cut**

- Articles, projects, bookshelf, talks, résumé, and `/now` templates (after this project)
- A global type-scale change (that would restyle those pages)
- New top-nav items (no Chess in the header)
- Homepage Field Notes card / newsletter block
- Gutter postcard crop of the pixel scene
- Night-sky first screen (Home B)
- Visitor / guest postcard page
- Retro MySpace / Facebook skin
- Footer hit counter tied to Rapid games

Those last three are **after-action**, not phases here. Stefan liked the counter. Do not start them until he says this project is done.

---

## Decisions (13 Sep 2026)

| Question | Call |
| --- | --- |
| Scope | Homepage + chess only |
| Headline | `stefan is ___` as the h1. First sentence under it: “I build systems for a living and escape plans for fun.” Stefan will pass on the line after he sees it. |
| Verb | Cycle. Learning slot is **writing Ruby** (not “learning Ruby”). Keep running, playing chess, planning our next move. If the header pill says he’s playing, **playing on Lichess** goes first. |
| Nav | Unchanged: Now, Articles, Talks, Projects |
| Pixel scene | **Full-width horizon at the bottom of the page**, after the talk row and right above the footer. Night falls at the end. Mid-page it read as a full stop between the bio and the lists. Not a gutter stamp either; a 9rem crop hides the landscape. Header stays the normal cream bar (`has-pixel-hero` goes away). |
| Field Notes | **Footer only.** Already in the footer. A homepage subscribe block is a second door. |
| Chess | Phase 2. Default is the mock (see options below). |
| Design lab | Delete `/design-lab/` and the lab layout when Phase 1 lands |
| Bio | Veteran, ServiceNow, Ruby. Do not say Army. Do not put CYC on the homepage. |

---

## Chess — options for Phase 2

Stefan saw all three built on localhost (13 Sep 2026) and picked **3**.

1. **Ship the mock.** Rating is the headline. One start-to-target rail. Target drawn on the chart. Games as a list. Study, then compare.
2. **Quiet C-style.** Same facts, 34rem column, margin labels, no giant number. Matches home.
3. **Light restyle (picked).** Keep today’s `/chess/` sections and order. Shrink headings, tighten spacing, and stack the games table on a phone instead of scrolling sideways.

---

## This repo (already in place)

| What | Where |
| --- | --- |
| Homepage | `src/pages/index.njk` |
| Home CSS | `src/assets/css/local/home.css` |
| Base layout | `src/_layouts/base.njk` |
| Header / footer / nav | `src/_includes/partials/header.njk`, `footer.njk`, `src/_data/navigation.js` |
| Pixel scene | `src/_includes/partials/pixel-hero.njk`, `src/assets/scripts/components/pixel-hero.js` |
| Lichess data | `src/_data/lichess.js`, `src/_data/experiment.yaml` |
| Chess page | `src/pages/chess.njk`, `src/assets/css/local/chess.css` |
| Projects / talks | `src/_data/projects.yaml`, `src/talks/` |
| Tokens | `src/assets/css/global/base/variables.css` |
| Copy | `docs/site-voice.md` |

Extend those. Do not add a second layout. `src/_layouts/lab.njk` is throwaway and dies in Phase 1.

---

## Standing rules

- One phase per session. Stop until Stefan says next phase.
- Fit this repo. Input `src/`, data `src/_data/`, pages `src/pages/`, includes `src/_includes/`, output `dist/`.
- Homepage CSS stays local (`home.css`). Do not change `global-styles.css` type sizes.
- Do not invent Lichess endpoints. Chess still reads `lichess.js`.
- Copy: `docs/site-voice.md`. Direct sentences. No “Army.” No CYC on the homepage.
- Do not rewrite dated `/now` entries. The CYC note stays in the `/now` archive; it just does not appear on home.

---

## Phase 1 — Homepage C

**Build**

- Rewrite `src/pages/index.njk` as the C page: wordmark, systems line, veteran / ServiceNow / Ruby bio with a résumé link, Odin now line (no CYC), writing rows, project rows, chess row (live Rapid, links to `/chess/`), one talk row.
- New cycling script `src/assets/scripts/bundle/stefan-is.js` (`writing Ruby`, `running`, `playing chess`, `planning our next move`; `playing on Lichess` when the pill is playing). Respect `prefers-reduced-motion`.
- Replace `src/assets/css/local/home.css` with the C column + mid-page horizon. Drop overlay-header / `has-pixel-hero` styles.
- `src/_layouts/base.njk`: homepage body class is `home`, not `has-pixel-hero`.
- Delete the design lab: `src/pages/design-lab/`, `src/_layouts/lab.njk`, `src/_includes/partials/lab-*.njk`, `src/assets/css/local/design-lab.css`, `src/assets/scripts/bundle/lab-stefan-is.js`.
- Homepage meta description: drop “Army veteran”.

**Endpoints:** none new.

**Verify first:** none. Data already used on `/now` and `/chess/`.

**Gotchas**

- Sticky gutter labels need a `top` that clears the real header, not the lab bar.
- `pixel-hero.njk` still injects `header-dock.js`. Harmless without `has-pixel-hero`.
- Do not embed `collections.nowEntries[0]` on home while that entry is the CYC note.
- Do not edit `navigation.js` or `src/pages/chess.njk` in this phase.

**Done when**

- `/` is the C homepage. `/chess/` is still today’s chess page.
- `/design-lab/` 404s.
- Articles, projects, talks, bookshelf, `/now` look as they do on `main`.
- Light and dark, 1440 and 390, still readable.

---

## Phase 2 — Chess

**Build:** option 3. CSS only, in `src/assets/css/local/chess.css`. `src/pages/chess.njk` is untouched. Page title down one step, h2s down to step 1, scoreboard numbers down one step, section gap `--space-l-xl`, and under 40em the games table becomes stacked rows (thead hidden, opponent bold, “Rated” prefix on the rating cell).

**Endpoints:** none new.

**Gotchas:** do not change `lichess.js` unless a real schema mismatch shows up. Tokens stay out of the client. Compare-with-me keeps the `chess-chart__*` hooks.

**Done when:** `/chess/` has the same sections in the same order, smaller headings, and no sideways scroll on the games table at 390. Homepage chess row still points here.

---

## After this project (not phases)

1. Restyle articles, projects, bookshelf, talks (and maybe `/now`) to the same rows.
2. Guest / postcard wall — safe, moderated, hard to flood.
3. Retro MySpace / Facebook skin easter egg.
4. Footer counter that shows Rapid games in the window (or the live rating), 90s-counter style. Stefan liked this.

---

## After it ships

Leave this file in `docs/`. Update **Status** at the top when a phase lands.
