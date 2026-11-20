# The crew: project plan

A "The crew" section on `/ai` that shows the bots that help run this site, each as a small Open Bot Avatar character with a name, a one-line job, and a state pill.

**Status (20 Nov 2026):** Phase 1 is in the first PR. Phase 2 is not started. Job lines in `src/_data/crew.yaml` are provisional until the writer locks them before merge.

**Cut:** live statuses from any server or API, a separate `/crew` page, per-bot detail pages, any change to headers or CSP, `open-bot-avatar` as an npm dependency, and anything about family, places, money, servers, or accounts.

---

## This repo (already in place)

| What | Where it lives |
| --- | --- |
| The page | `src/pages/ai.njk`. The section goes after the workflows loop and before "What I'm learning". |
| Page data | `src/_data/*.yaml` (loaded by the yaml data extension in `eleventy.config.js`) |
| CSS | `src/assets/css/rasa/pages.css`, inlined through `{% css "rasa" %}`. Six colour tokens in `site.css`. |
| Page scripts | `src/assets/scripts/components/*.js`, esbuilt to `/assets/scripts/components/` by `src/_config/events/build-js.js` |
| Headers and CSP | `netlify.toml` and `vercel.json`. CSP is `upgrade-insecure-requests;` only. |
| Tests | `test/smoke.test.js` reads `dist/` after a build. |

## Standing rules for the agent

- Vendor, don't install. `src/assets/scripts/vendor/open-bot-avatar.js` is a prebuilt IIFE with the version, source URL, and MIT header at the top. `open-bot-avatar.LICENSE` sits next to it. `package.json` and `package-lock.json` never name the package.
- To upgrade: in a scratch dir outside the repo, `npm i open-bot-avatar@<version> esbuild`, then bundle an entry that re-exports `mountAvatar`, `prefersReducedMotion`, and `validateAvatar` with `esbuild entry.js --bundle --format=iife --global-name=OpenBotAvatar --minify --target=es2020`. Update the header and the version check in `test/crew.test.js`.
- Netlify caches `/assets/*` for a month. A changed vendored build or a changed `crew.js` needs a new filename (for example `open-bot-avatar-0.4.0.js`) or visitors keep the old one.
- Card text is server-rendered. JS only mounts avatars, so the section reads the same with JS off.
- Avatars are decorative (`label: ''`, which sets `aria-hidden`). The visible `h3` names the bot.
- Reduced motion: no pointer follow, no animation.
- Every avatar definition passes `validateAvatar`. The test runs the vendored copy.
- No em or en dashes in crew copy or comments.

---

## Phase 1: static crew cards

**Build:** `src/_data/crew.yaml` (note, five members with name, job, state, optional mood, avatar definition). The section in `ai.njk` with heading "The crew", anchor `#crew`, the note "Sample statuses, not live.", a two-column card grid that drops to one column under 40rem. Pill styles per state (working, thinking, waiting, blocked, done, idle) from the six tokens. Vendored script plus `crew.js`, both deferred, loaded only on `/ai`. A new captain avatar.

**Endpoints:** none.

**Verify first:** run `validateAvatar` on every definition before committing it.

**Gotchas:**
- The HTML minifier reorders attributes. Tests must not depend on attribute order.
- A still avatar does not repaint itself, so `crew.js` asks for a frame when the theme changes.
- The avatar host stays `hidden` until JS mounts it, so a JS-off visitor doesn't see empty squares.

**Done when:** lint, typecheck, tests, build, and smoke pass; the smoke test finds five cards that match `crew.yaml` and finds the vendored script on `/ai` only; deploy preview screenshots at 1440 and 390 wide, light and dark, are in the PR.

## Phase 2 (stretch): click to cycle states

**Build:** each card's avatar becomes a `button` that cycles through the six states for demo purposes. The pill text updates with it and is announced through a polite live region. The hand-set state in `crew.yaml` stays the default on load.

**Gotchas:** keyboard and screen reader behaviour must match the mouse. Under reduced motion the state still changes, without animation.

**Done when:** the cycle works by mouse, keyboard, and touch, and the pill and avatar never disagree.
