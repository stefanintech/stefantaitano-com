# Chess Page — Project Plan

A `/chess` page on stefantaitano.com driven by the Lichess API, plus a tighter summary on `/now`. Six phases, each shipping something visible on its own.

This plan is written for **this repo**, not a generic Eleventy layout. Keep the existing folders, data files, OG pipeline, and `/now` Chess block. Extend them. Do not invent a parallel `_data/` at the repo root, a `_site/` output, or a second fetch stack.

Every endpoint below was checked against the Lichess OpenAPI spec (version 2.0.165) rather than recalled from memory. Three endpoints in Phase 4b are flagged as unverified; they are the only ones.

**Stack:** Eleventy Excellent (v3, ESM), deployed on Netlify. Input `src/`, output `dist/`.
**Lichess handle:** `Late2TheBoard` (already in `src/_data/personal.yaml` and `src/_data/lichess.js`)
**Study:** `Rapid Games`, ID `SIFyPf3b`, Public + Share & export: Everyone
**Experiment window:** Aug 27 – Oct 7, 2026 | **Target:** rapid rating above 1000

**Cut:** blunder wall, opening explorer, puzzles on `/chess/`, play-well heatmap. Puzzle stats already on `/now` stay there.

---

## This repo (already in place)

Do not relocate or rename these. Build around them.

| What | Where it lives today |
| --- | --- |
| Lichess user fetch | `src/_data/lichess.js` — `@11ty/eleventy-fetch`, `duration: '6h'`, returns the raw user JSON |
| `/now` Chess block | `src/pages/now.njk` — `lichess.perfs.rapid`, `lichess.perfs.puzzle`, `lichess.count`, plus a Lichess challenge link |
| `/now` styles | `src/assets/css/local/now.css` |
| Profile URL | `src/_data/personal.yaml` → `platforms.lichess` |
| Pages | `src/pages/` with permalinks like `/now/index.html` |
| Page intros | `src/_includes/partials/page-intro.njk` + `src/assets/css/local/page-intro.css` |
| Scoped CSS | `src/assets/css/local/` via `{% css "local" %}` |
| OG images | `src/common/og-*.njk` → `/assets/og-images/*.svg`, rasterized by `src/_config/events/svg-to-png.js` (Sharp + `src/_config/og-fonts/`) |
| OG meta | `src/_includes/head/meta-info.njk` reads `discover.image` |
| Inline JS bundle | `src/_includes/head/js-inline.njk` (`{% js "inline" %}`) |
| Site header | `src/_includes/partials/header.njk` |
| Copy | `docs/site-voice.md` |
| Theme tokens | `src/assets/css/global/base/variables.css` and `docs/eleventy-excellent-reference.md` |

`package.json` already has `@11ty/eleventy` `^3.1.2` and `@11ty/eleventy-fetch`. Do not add a second fetch library.

---

## Dedicated page or `/now`?

Both, weighted to the dedicated page. `/chess/` is the real thing — a URL you can link from a stream bio, with room for a rating chart and an embedded board. `/now` already has a Chess heading, rating table, and W/D/L line. Phase 2 **evolves that block** (status line + link across) instead of replacing it with a three-line stub.

Both pages keep reading `lichess.*` from the same data file. Window and target live in one extra data file. That `/now` edit is a ten-minute task at the end of Phase 2, not its own phase.

The `/now` line “climb from 700 to 1200” is the long-term improver goal. The six-week target of 1000 is the scoreboard. Do not overwrite one with the other.

---

## Rules for the agent

1. **Do not invent Lichess endpoints, parameters, or response shapes.** Every endpoint used here is listed with its exact path. If you need something not on the list, stop and say so. Canonical reference: <https://lichess.org/api>, form tester at <https://lichess.org/api/ui>, raw spec at `lichess-org/api` → `doc/specs/lichess-api.yaml`.
2. **Run the curl in each phase before writing the parser.** Look at real JSON or real PGN, then write code against what you saw. Never against an assumed schema.
3. **One phase per session.** Commit at the end. Don't start the next unprompted.
4. **No tokens in client-side code or committed files.** Lichess's own docs are blunt about this: tokens can perform arbitrary actions within their scope, you remain responsible, and they must never reach a frontend bundle. Phases 0–5 run at build time or in a Netlify Function.
5. **Check `package.json` for the Eleventy version first.** This repo is v3 ESM (`"type": "module"`). Module style and the data-file API differ between v2 and v3.
6. **The spec moves.** It's at 2.0.165 and gets published on a near-daily cadence. If you pull in `@lichess-org/types`, pin the version.
7. **Fit this repo. Do not invent a parallel layout.** Input is `src/`, data is `src/_data/`, pages are `src/pages/`, includes are `src/_includes/`, output is `dist/`. Extend files that already do the job. New files go in those same folders. Prefer existing tokens, layouts, CSS bundles, and the SVG OG pipeline over a new stack. Do not create a root `_data/` or `_site/`.

---

## Standing instruction: "here's a new study embed"

This applies at any time, in any session, including after the project ships. When Stefan pastes a Lichess study embed iframe, a study URL, or a chapter URL into the chat, treat it as a request to update the featured game and run this procedure without being asked.

**1. Extract the two IDs.** Accept any of these shapes:

```
<iframe src="https://lichess.org/study/embed/{studyId}/{chapterId}" ...>
https://lichess.org/study/embed/{studyId}/{chapterId}
https://lichess.org/study/{studyId}/{chapterId}
https://lichess.org/study/{studyId}
```

The last form has no chapter ID. **Stop and ask which chapter** — do not guess, do not default to the first or last one, do not fetch the study and pick for him. IDs are case-sensitive 8-character strings; copy them exactly, character for character. If you cannot parse both IDs with certainty, stop and say so.

**2. Verify the chapter resolves and grab its tags.**

```bash
curl -s 'https://lichess.org/api/study/{studyId}/{chapterId}.pgn' | head -20
```

A 404 or empty response means the ID is wrong or the study's Share & export setting changed. Report that and stop; do not write anything to disk.

**3. Update `src/_data/study.json`.** Overwrite in full:

```json
{
  "studyId": "...",
  "chapterId": "...",
  "annotatedOn": "YYYY-MM-DD",
  "white": "from the [White] tag",
  "black": "from the [Black] tag",
  "whiteElo": "from [WhiteElo]",
  "blackElo": "from [BlackElo]",
  "result": "from the [Result] tag",
  "playedOn": "from [UTCDate], as YYYY-MM-DD",
  "blurb": ""
}
```

- `annotatedOn` is today's date, not the game's date. Both matter and they're different.
- Caching the tags here keeps Phase 4a fully static — the lead-in line above the board renders with no build-time API call.
- **Preserve the existing `blurb` unless Stefan supplied a new one in the same message.** If he pasted a sentence alongside the link, that's the blurb. If the field is empty and he gave nothing, leave it empty and mention it once; don't write a blurb on his behalf.

**4. Report the change.** Show the before/after diff of `src/_data/study.json` and the resulting embed URL. Don't commit unless asked.

**Do not, ever:**
- Paste the raw iframe HTML into a template. The template builds the URL from `study.json`. The only file this procedure touches is `src/_data/study.json`.
- Carry over `theme`, `pieceSet`, `bg`, or any other query params from the pasted iframe. The template owns styling.
- Invent, autocomplete, or "correct" a chapter ID.

---

## Phase 0 — Data layer

**Build:**
- **Extend** `src/_data/lichess.js`. Do not move it, do not add a second Lichess data file, do not change the path `/now` already reads.
- Keep returning the user profile fields at the top level so existing templates keep working: `lichess.perfs.rapid.rating`, `lichess.perfs.puzzle.*`, `lichess.count.win` / `draw` / `loss`. Add extra keys for rating history and games (`ratingHistory`, `recentGames`, or similar) rather than wrapping the profile in a new shape that would break `/now`.
- Keep `@11ty/eleventy-fetch`. Keep the existing `duration: '6h'` unless a later phase has a concrete reason to shorten it.
- One `fetchLichess(path)` helper: sets `Accept: application/json`, makes requests **sequentially** (the spec says explicitly to make one request at a time), and surfaces a 429 with a clear error. On 429, wait a minute before retrying; some limits need longer.
- Fail soft. Today a dead fetch can fail the build. Improve that: empty data and a page that says so, not a failed deploy.

**Endpoints:**

```
GET /api/user/Late2TheBoard
GET /api/user/Late2TheBoard/rating-history
GET /api/games/user/Late2TheBoard
```

**Verify first:**

```bash
curl -s 'https://lichess.org/api/user/Late2TheBoard' | jq '.perfs'
curl -s 'https://lichess.org/api/user/Late2TheBoard/rating-history' | jq '.[] | .name'
```

**Gotchas:**
- `rating-history` returns each point as an array and **the month is zero-indexed**. January is `0`. One named conversion function, with a comment.
- `/api/games/user/{username}` streams NDJSON and returns your whole history unbounded. Always set `max`, `since`, `until`, `perfType=rapid`. Send `Accept: application/x-ndjson` and parse line by line.

**Done when:** the fetched object prints on build, `/now` still renders rating/games/record from `lichess.*`, and the new fields are available for later templates.

---

## Phase 1 — The `/chess` page

**Build:**
- New page at `src/pages/chess.njk`, permalink `/chess/index.html`, same pattern as `src/pages/projects.njk` / `src/pages/bookshelf.njk`: `layout: base`, `page-intro` kicker/lede, copy that matches `docs/site-voice.md`.
- Short intro: what the six weeks are, and that every number comes from Lichess rather than being typed in.
- Current rapid rating, games played, W/D/L from the existing `lichess.perfs` / `lichess.count` fields.
- Rating curve for rapid as **inline SVG generated at build time**. No chart library, no client-side JS.
- **Last five rated rapid games**: result, opponent name and rating, date, link to the game. Colour-code the result with existing tokens (`--color-primary`, etc.), not ad hoc hex.
- Scoped CSS in `src/assets/css/local/chess.css`, included with `{% css "local" %}`. Reuse `/now` table styles where they already fit; do not duplicate a second stats-table system.
- Do not add `/chess/` to the main nav unless asked. It is a linkable URL first.

**Gotchas:**
- Ratings live under `perfs`, keyed by perf type. Confirm key names against real output. `/now` already uses `rapid` and `puzzle`.
- If a rating is flagged **provisional**, say so rather than presenting it as settled.

**Done when:** the page builds with zero client-side JS, the rating matches your profile, and `/now` is unchanged besides still reading the same data file.

---

## Phase 2 — The scoreboard

**Build:**
- Block at the top of `/chess/`: start rating on Aug 27, current, target of 1000, days remaining to Oct 7, games played in the window.
- Progress bar from start to target. If you're below start, show it below. No clamping to zero.
- Window and target live in `src/_data/experiment.yaml` (YAML, like `personal.yaml` / `projects.yaml` / `books.yaml`). One file, both pages read it.
- One status line from the numbers — on track, behind, done. Thresholds written down explicitly; the agent does not invent a scoring formula.
- **Then `/now`:** keep the existing Chess heading, rating table (rapid + puzzles), W/D/L, and challenge link. Add a short experiment status line and a link to `/chess/`. Do not replace the table with a three-line stub. Do not edit dated files in `src/now-entries/` for this.

**Endpoint:**

```
GET /api/games/user/Late2TheBoard?since={ms}&until={ms}&perfType=rapid&rated=true&max=300
```

**Gotchas:**
- `since` and `until` are **Unix milliseconds**. Not seconds, not ISO strings. Most likely bug in this phase.

**Done when:** the numbers are right and changing the target date in `src/_data/experiment.yaml` updates both pages.

---

## Phase 3 — The live "playing right now" dot

**Build:**
- `netlify/functions/lichess-status.js` — new folder, Netlify's default functions path. Do not restructure `netlify.toml` beyond what the function needs. Proxies the status endpoint, returns `{ online, playing, gameId }`, sets `Cache-Control` around 30 seconds.
- A small script in `src/assets/scripts/` included through the existing `{% js "inline" %}` bundle in `src/_includes/head/js-inline.njk`. Call the function **once on page load**. No polling.
- Status mark in `src/_includes/partials/header.njk` (the default header). Leave `header-compact.njk` alone. If `playing`, render a dot linking to `https://lichess.org/{gameId}`. Online but idle gets a different colour. Offline renders nothing.
- Fail silent. Function errors leave the header looking exactly as it does today.

**Primary endpoint:**

```
GET /api/users/status?ids=Late2TheBoard&withGameIds=true
```

**Optional enrichment:**

```
GET /api/user/Late2TheBoard/current-game
```

This returns the ongoing game itself, so the dot can say "playing 15+10 vs someone rated 940" instead of just being a dot. Only call it when the status endpoint reports `playing`, so the common case stays one cheap request. Note that ongoing games are served with a **3-move anti-cheat delay**, so don't try to show a live position and expect it to be current.

**Verify first:**

```bash
curl -s 'https://lichess.org/api/users/status?ids=Late2TheBoard&withGameIds=true' | jq .
curl -s 'https://lichess.org/api/user/Late2TheBoard/current-game' | head
```

Run both logged out and mid-game so you see both shapes. Fields are **omitted** rather than set to `false` — check for key presence, not truthiness.

**Gotchas:**
- Go through the function rather than calling from the browser. Don't assume CORS headers.
- The status endpoint is cheap and lightly limited; once per pageload is fine, an interval is not.
- `netlify.toml` currently has no `functions` directory setting; Netlify's default `netlify/functions` is the fit. Don't invent a functions tree under `src/`.

**Done when:** the dot appears mid-game and links to that game.

---

## Phase 4 — Annotated game of the week, from your study

Your study settings are already correct: Public visibility with Share & export set to Everyone. That second setting is the one that governs API export.

**Do 4a. Treat 4b as optional and later.**

### 4a — Paste the embed, keep the ID in data (30 minutes)

On the study, open the chapter you want, hit the share button, and Lichess hands you the iframe HTML for that chapter. That's ground truth — no guessing at IDs, no parsing.

Then, and this is the part that matters: **do not hardcode the iframe in a template.** Put the IDs in `src/_data/study.json`:

```json
{
  "studyId": "SIFyPf3b",
  "chapterId": "...",
  "annotatedOn": "2026-08-30",
  "blurb": "Played this right after watching Bartholomew on undefended pieces."
}
```

The `/chess/` template builds the embed URL from those fields:

```
https://lichess.org/study/embed/{studyId}/{chapterId}?bg=auto&theme=auto
```

Optional params if you want it to match the site: `theme` (blue, brown, green, ic, purple), `pieceSet`, `bg` (light, dark, system). The embedded text auto-translates to the visitor's language.

Print `annotatedOn` next to the board as "annotated 30 Aug." A dated board that's three weeks old reads as an archive. An undated one reads as broken.

**Why this over automating it:** adding a chapter to the study is already a manual act. You're in Lichess writing the annotation anyway, so copying one iframe while you're there costs nothing and happens weekly at most. The automated version's failure mode — a broken build, or the wrong chapter shown publicly — is worse than the manual version's, which is you forgetting for a week.

**Done when:** the board renders on `/chess/` with your annotations, and swapping games is a one-line edit to `src/_data/study.json`.

### 4b — Automate the chapter pick (optional, only if 4a annoys you)

The seam is already in place: `src/_data/study.json` becomes `src/_data/study.js`, populated from the API instead of by hand. Nothing in the template changes.

**Check these before writing anything.** The spec lists them, and if they behave the way their names suggest they replace all PGN parsing:

```
GET /api/study/{studyId}/{chapterId}          # contract unverified
GET /api/study/{studyId}/{chapterId}/tags     # contract unverified
GET /api/study/{studyId}/{chapterId}/moves    # contract unverified
GET /api/study/by/{username}                  # your studies, with metadata
GET /api/study/{studyId}.pgn                  # all chapters as PGN
GET /api/study/{studyId}/{chapterId}.pgn      # one chapter as PGN
```

```bash
curl -s 'https://lichess.org/api/study/by/Late2TheBoard' | head
curl -s 'https://lichess.org/api/study/SIFyPf3b.pgn' | head -40
curl -s 'https://lichess.org/api/study/SIFyPf3b/{chapterId}'
curl -s 'https://lichess.org/api/study/SIFyPf3b/{chapterId}/tags'
```

**If the JSON endpoints return useful data:** use them directly. **If they 404 or need auth:** fall back to exporting the full study PGN, splitting into chapters, and reading the chapter ID from each `[Site]` tag. Known failure there — a chapter created from an imported game can carry its own `[Site]` tag that overwrites the study URL. If that hits your chapters, parse `[Event]`, which holds "Study name: Chapter name."

**"Most recent" is not a concept the API has.** Chapters come back in study order. Yours is already chronological (chapter 1 is the game at 936, chapter 2 at 963), so take the last chapter and sanity-check against the game's `[UTCDate]` tag.

**Gotchas for both 4a and 4b:**
- **Don't use `@lichess-org/pgn-viewer`.** It's GPL-3.0, and using it means your site's combined work must be GPL with source released to visitors. The iframe keeps the code on Lichess's servers.
- Handle the empty case. A missing chapter ID means the section doesn't render, not a broken board.
- If you ever set the study to unlisted, the fallback is a personal access token with the **`study:read`** scope in a Netlify environment variable. Build-time only, never in the browser.
- `netlify.toml` sets `X-Frame-Options: DENY` (this site cannot be framed). That does not block embedding Lichess. If CSP later grows a `frame-src`, allow `https://lichess.org`.

**Optional alternative:** `/api/games/export/bookmarks` exports games you've bookmarked on Lichess, making "bookmark it" the publish action instead of maintaining a study. Worth knowing; don't build both.

---

## Phase 5 — Auto-generated social card

**Build:**
- Do **not** add `satori` or `@resvg/resvg-js`. This repo already generates OG PNGs from SVG templates.
- Add `src/common/og-chess.njk` next to `og-default.njk` and `og-rubyconf-2026-talk.njk`. Permalink `/assets/og-images/chess-preview.svg`. Current rapid rating in large type, rating curve behind it, target, your name. Reuse `partials/og-chrome.njk` and/or the Phase 1 SVG generator. Fonts already live in `src/_config/og-fonts/`; Sharp rasterizes in `eleventy.after` via `svgToPng`.
- Output lands in `dist/assets/og-images/chess-preview.png` (same as every other card). Do not write `_site/img/og/`.
- On `src/pages/chess.njk`, set `discover.image` to `/assets/og-images/chess-preview.png` so `meta-info.njk` wires `og:image` and `twitter:image` the same way talks and posts already do.
- Cache-bust with a query param derived from the current rating (`?v={{ lichess.perfs.rapid.rating }}` or similar). Do not invent a second meta pipeline.

**Gotchas:**
- Must run **after** the Phase 0 fetch, in the same Eleventy build. `src/common/` templates already have access to global data.
- Social platforms cache OG images hard. The rating query param is the cache-bust.

**Done when:** the card regenerates each build through the existing SVG→PNG step, and the card validators show the current number.

---

## Phase 6 — Log in with Lichess and compare (stretch)

Don't start until 1–5 are live.

**Build:**
- OAuth 2.0 authorization code flow with PKCE. Unregistered and public clients are supported, so no client secret, no registration, no backend. Choose any unique client ID (your domain works). Only `S256` is accepted as the code challenge method. Tokens are long-lived, around a year, and **refresh tokens are not supported**.
- **Request no scopes.** Public profile and rating history need none, and an empty consent screen is the difference between a visitor clicking through and bouncing.
- Store the token in `sessionStorage`, not `localStorage`. It's the visitor's real credential, valid for a year, with no revocation path from your side.
- Script lives under `src/assets/scripts/`, loaded the same way other page scripts are (defer bundle / is-land), not a new runtime.
- On callback, fetch their profile and rating history, overlay their rapid curve on yours in the same SVG, compare rating and games played.
- If they've ever played you, `/api/crosstable/{user1}/{user2}` returns the head-to-head record. Show it when it's non-empty and skip the section silently when it isn't.
- Visible "disconnect" button clearing storage. Say plainly on the page that nothing is stored server-side.

**Endpoints:**

```
GET  https://lichess.org/oauth              # authorization URL
POST https://lichess.org/api/token          # token URL
POST https://lichess.org/api/token/test     # useful for debugging a token
GET  /api/account                           # visitor's own profile
GET  /api/user/{username}/rating-history
GET  /api/crosstable/{user1}/{user2}
```

**Verify first:** the official demo at <https://lichess-org.github.io/api-demo/> implements this flow; source at `lichess-org/api-demo`, and there's a minimal client-side example in `lichess-org/api` under `example/oauth-app`. Point the agent at those rather than letting it write PKCE from memory.

**Gotchas:**
- The redirect URI must match exactly, trailing slash included. This is the hour you'll lose.
- Handle the visitor declining authorization. It's the most common outcome after curiosity.

---

## Order

Phase 0 → 1 → 2 → 3 → 4 → 5 → 6

Phases 1 and 2 together are a shippable page. Phase 3 is the small fun one. Phase 4 is where the page becomes something people return to, which is why the endpoint check at the top of it is worth doing before you commit to an approach.

When `/chess/` exists, add it to `meta.tests.pa11y.customPaths` in `src/_data/meta.js`. That is the existing a11y list, not a new test runner.
