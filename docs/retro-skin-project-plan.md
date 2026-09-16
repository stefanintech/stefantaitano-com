# Retro skin easter egg — Project plan

A 2006-ish profile skin on the homepage and `/links/` only. One visible slice per session.

**Status:** Phase 1 and Phase 2 landed. Guest / postcard wall stays parked.

**Outcome:** On `/` and `/links/`, a visitor can turn the page into a late-MySpace / early-Facebook profile for a moment, then leave it. Every other page stays as it is. The existing `stefan` / Lichess eggs stay theirs.

**Cut**

- Whole-site skin (articles, projects, bookshelf, talks, chess, `/now`, résumé, legal)
- Guest / postcard wall
- A second social network as Phase 1 (no Facebook-blue theme until Phase 2, if ever)
- Stealing the `stefan` keyword or the links photo long-press (those open Lichess)
- Autoplay audio, glitter cursors, or anything that fights `prefers-reduced-motion`
- A new layout. This is a class plus local CSS on two pages.

---

## Why only `/` and `/links/`

Those two pages are “this is me.” The homepage is the directory. `/links/` is already a profile card with a hidden door. A 2006 skin belongs there.

It does **not** belong on articles, projects, bookshelf, talks, or chess. Stefan likes those as they are, and a retro overlay on a long article or a scoreboard is a different joke. `/now` is close, but it is a dated journal, not a profile. Leave it out unless he asks.

---

## Decisions

| Question | Call (13 Sep 2026) |
| --- | --- |
| Where | **`/` and `/links/` only** |
| Skin | One look in Phase 1: late-MySpace profile (about me, a “top 8” of doors that already exist, chunky chrome). Not a second Facebook theme yet. |
| Trigger | Type **`2006`**. Does not steal `stefan`. Homepage also: three clicks on the pixel moon (already a hit target). `/links/` has no second gesture in Phase 1 — keyboard only there — so the photo long-press stays Lichess. |
| Exit | Always obvious. **Escape** and a visible **“Leave 2006”** control in the retro chrome. Never trap focus without a way out. |
| Persist | `sessionStorage` key `retro-2006`. Refresh in this tab keeps it. A new tab is normal until they type `2006` again. |
| Reduced motion | Skin still applies. No sparkle, no scroll-jacking, no autoplay. |
| Existing eggs | `stefan` on the homepage still throws pawn confetti. Hold-photo / `stefan` on `/links/` still opens the Lichess dialog. |

If the trigger or the MySpace-only first skin is wrong, say so before Phase 1.

---

## This repo (already in place)

| What | Where |
| --- | --- |
| Homepage | `src/pages/index.njk`, `src/assets/css/local/home.css` |
| Links page | `src/pages/links.njk`, `src/assets/css/local/links.css`, `src/_data/links.yaml` |
| Base layout | `src/_layouts/base.njk` (`home` class on `/`, `compactHeader` on `/links/`) |
| Pixel moon | `src/assets/scripts/components/pixel-hero.js` (already a button) |
| Homepage egg | `src/assets/scripts/components/custom-easteregg.js` (keyword `stefan`) |
| Links egg | `src/assets/scripts/components/custom-links-egg.js` (hold photo + `stefan`) |
| Tokens | `src/assets/css/global/base/variables.css` |
| Copy | `docs/site-voice.md` |

New files go next to those: `src/assets/css/local/retro-2006.css` and `src/assets/scripts/bundle/retro-2006.js`. Include them only from `index.njk` and `links.njk`. Do not add a `lab` layout.

---

## Standing rules

- One phase per session. Stop until Stefan says next phase.
- Fit this repo. Input `src/`, includes `src/_includes/`, CSS local, JS in `src/assets/scripts/bundle/`.
- Do not change `navigation.js`. Do not restyle articles, projects, bookshelf, talks, or chess.
- Do not invent Lichess endpoints. This feature does not talk to Lichess.
- Copy: `docs/site-voice.md`. The retro chrome can be a little funnier than the rest of the site. The exit control must be plain English.
- Prefer existing tokens. A 2006 skin will need a few extra colors (profile blue, table border). Keep them scoped under `[data-era='2006']`. Do not rewrite `variables.css`.
- No tokens in client-side code.

---

## Phase 1 — Homepage skin

**Build**

- `src/assets/scripts/bundle/retro-2006.js`: listen for the `2006` key sequence on `/` only. On match, set `data-era="2006"` on `<html>` and write `sessionStorage`. On load, restore if the key is set. Escape and `[data-era-exit]` clear the attribute and the key.
- Wire the existing pixel-moon button: third click in a short window also toggles the skin. Do not remove the airplane on the first click.
- `src/assets/css/local/retro-2006.css`, included from `index.njk` only in this phase: under `[data-era='2006']`, restyle the homepage into a profile (chunky header bar, about-me box using the existing bio, a “top 8” row pointing at `/now/`, `/articles/`, `/projects/`, `/talks/`, `/chess/`, `/bookshelf/`, `/resume/`, `/links/`). Visible **Leave 2006** control, top-right.
- Keep the cycling wordmark and the footer counter. They can look a little more 2006. They must still work.

**Endpoints:** none.

**Verify first:** none.

**Gotchas**

- `stefan` and `2006` must not fight. Separate key buffers.
- The moon already fires an airplane. Count clicks; do not disable the first two.
- `sessionStorage` is per tab. That is what we want.
- Local CSS only. A global `[data-era='2006'] body` rule would leak if someone later includes the CSS on another page. Still scope every selector.
- Light and dark: pick one retro palette and stick to it while the skin is on. Do not try to theme-switch 2006.
- 1440 and 390 both have to remain usable. Top 8 can wrap.

**Done when**

- `/` looks like today until you type `2006` or triple-click the moon.
- The skin is obviously a profile, obviously reversible, and Escape or **Leave 2006** puts the page back.
- Refresh in that tab keeps the skin. `/chess/` and `/articles/` are untouched.
- `stefan` still throws confetti. The footer counter still links to `/chess/`.
- `/links/` is still the current links page (Phase 2).

---

## Phase 2 — Links page skin

**Build**

- Include the same CSS and JS from `links.njk`.
- Type `2006` toggles the skin. Do **not** bind it to the photo. Hold-photo / `stefan` stay Lichess.
- Top 8 on this page is the existing `links.yaml` buttons, restyled as a friends grid. Same Leave 2006 control.

**Done when:** `/links/` can enter and leave 2006 the same way as `/`. The Lichess egg still opens from the photo.

---

## Later (not phases here)

- A Facebook 2005 variant (blue bar, wall, poke).
- Guest / postcard wall.
- Offering the skin on `/now`.

---

## After it ships

Leave this file in `docs/`. Update **Status** at the top when a phase lands.
