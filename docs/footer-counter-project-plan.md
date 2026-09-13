# Footer Rapid counter — Project plan

A 90s-style hit counter in the site footer, driven by the Rapid experiment already on `/chess/`. One visible slice per session.

**Status:** Phase 1 landed. Guest / postcard wall is parked. Articles, projects, bookshelf, and talks stay as they are.

**Outcome:** Every full footer shows a small odometer that reads like an old page-hit counter, except the number is rated Rapid games in the current experiment window. It links to `/chess/`. If Lichess missed this build, the counter is absent.

**Cut**

- Restyling articles, projects, bookshelf, talks, or `/now`
- Guest / postcard wall
- Retro MySpace / Facebook skin
- A live client-side Lichess fetch (no new endpoints; no tokens in the bundle)
- Putting Chess in the header nav
- Showing the counter on `/links/` (`compactHeader`)
- A second number in the footer (no live rating next to the games count)

---

## Decisions

| Question | Call (13 Sep 2026) |
| --- | --- |
| Other pages | Keep articles, projects, bookshelf, talks as they are. Stefan likes them. |
| Guest wall | Hold. |
| What the digits show | **Games in the experiment window** (`lichess.scoreboard.games`). Not the live Rapid rating. Rating already lives on the homepage chess row and on `/chess/`. A hit counter that ticks up with games is the joke. |
| Where | **Every full footer.** Hidden when `compactHeader` is true (`/links/` only, today). |
| Look | 90s odometer. Three padded digits (`007`). Existing tokens only (ink, cream, amber, gold). Not a GIF. |
| Link | The whole counter is one link to `/chess/`. |
| After 7 Oct 2026 | Keep showing that window’s count until Stefan starts a new experiment in `experiment.yaml`. Do not silently switch to lifetime Rapid games. |
| Freshness | Build time, same as the rest of the chess numbers. Stale until the next build. Say so in the accessible name if needed, not on the face of the counter. |

If any of those is wrong, say so before Phase 1 starts.

---

## This repo (already in place)

| What | Where |
| --- | --- |
| Footer | `src/_includes/partials/footer.njk` |
| Footer CSS | `src/assets/css/global/blocks/site-footer.css` |
| Tokens | `src/assets/css/global/base/variables.css` |
| Lichess / scoreboard | `src/_data/lichess.js` → `lichess.scoreboard.games` |
| Experiment window | `src/_data/experiment.yaml` |
| Chess page | `src/pages/chess.njk` |
| Compact header flag | `compactHeader` on `src/pages/links.njk` |
| Copy | `docs/site-voice.md` |

Extend the footer and the footer CSS. Do not add a second footer. Do not change `lichess.js` unless a real schema mismatch shows up. The games count is already computed.

---

## Standing rules

- One phase per session. Stop until Stefan says next phase.
- Fit this repo. Input `src/`, includes `src/_includes/`, CSS in `src/assets/css/`, output `dist/`.
- Do not invent Lichess endpoints. The number is already on `lichess.scoreboard`.
- No tokens in client-side code or committed files.
- Copy: `docs/site-voice.md`. Direct. No “learning in public.” The visible label can be as short as the digits; the accessible name does the talking.
- Prefer existing custom properties over ad hoc colors.
- Footer CSS is global (it is on every page). Keep the new rules in `site-footer.css`, scoped to `.hit-counter`. Do not restyle the rest of the footer.

---

## Phase 1 — Counter in the footer

**Build**

- In `footer.njk`, when `not compactHeader` and `lichess.scoreboard.games` is a number, render a link to `/chess/` that looks like a three-digit odometer.
- Pad with leading zeros (`7` → `007`). Each digit is its own cell so it reads as a counter, not a heading.
- Accessible name, not visible marketing copy: “7 rated Rapid games since 27 Aug. Full Rapid scoreboard.”
- `aria-hidden` on the decorative digits if the accessible name is on the link.
- Styles in `site-footer.css`: small, centered with the existing footer cluster or sitting above the “Made with” line. Dark wells, cream or gold digits, hairline border. Tokens only.
- `prefers-reduced-motion: reduce`: no animation.
- Optional one-shot tick on load (digits flip to the number once) only if it stays CSS/JS-local and respects reduced motion. If that fights the footer, ship static digits.

**Endpoints:** none. No curl. `lichess.scoreboard.games` is already used on `/` and `/chess/`.

**Verify first:** none.

**Gotchas**

- `lichess.js` runs at build time and can take a few seconds. The footer include must tolerate a missing scoreboard the same way `/chess/` does: no counter, no error.
- Global CSS. A loose `footer span` rule will restyle the theme switch and the legal links. Scope everything under `.hit-counter`.
- `/links/` uses `compactHeader`. Do not show the counter there.
- Do not edit `navigation.js`. Do not add Chess to the header.
- Do not put the Rapid rating in the footer in this phase.
- Three digits will overflow if the window ever hits 1000 games. That will not happen in this experiment. Leave a comment, do not build four digits “just in case.”

**Done when**

- Full pages (`/`, `/chess/`, `/articles/`, `/projects/`, `/talks/`, `/bookshelf/`, `/now/`) show the same counter, same number, linking to `/chess/`.
- `/links/` does not.
- If the Lichess fetch fails, those pages still render and the counter is gone.
- Light and dark, 1440 and 390, the counter is readable and does not wrap the footer into a mess.
- No new Lichess call in the browser.

---

## After it ships

Leave this file in `docs/`. Update **Status** at the top when Phase 1 lands.

A later experiment is a new `experiment.yaml` window. The counter will follow that file with no footer rewrite.

Possible later work, not phases here: guest wall, retro skin, a new experiment’s counter copy.
