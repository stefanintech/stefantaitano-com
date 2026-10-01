# Check-ins — Project plan

A "last seen" line on the homepage and a `/checkins/` timeline of public places I've been, each with a day and a night clay-diorama image. One visible slice per session.

**Status (1 Oct 2026):** Plan only. Nothing built yet. Phase 0 starts when Stefan says go and has answered the open questions at the bottom (or accepted the defaults).

**Outcome:** The homepage shows `Last seen at Minnehaha Falls · Minneapolis · 3 days ago` right after the "now" blurb. It links to `/checkins/`, a reverse-chronological list of check-ins. Every check-in shows up on the site no sooner than 24 hours after I was there. The image follows the site's light/dark toggle. No people, no home, no school, no third-party scripts.

**Cut**

- People of any kind: companions, "with family," names, faces, figures in the dioramas. The schema has no field for them.
- Private or family-only entries in this repo, in any form (`draft: true` included; git history is public)
- Exact coordinates, home, kids' schools, daycare, relatives' homes
- Live location, or anything that says where I am right now
- Third-party maps, tiles, or map scripts (Leaflet, Mapbox, Google Maps)
- Per-check-in pages, OG images, and a check-ins feed (later, maybe)
- The photo-to-diorama check-in bot, stats, map, "on this day," monthly recaps (Phases 2–3, future only)
- Changing the hand-written homepage "now" blurb or `/now` itself
- A fifth top-nav item. The link goes in the footer.

---

## Decisions

| Question | Call (1 Oct 2026) |
| --- | --- |
| What gets shown | **Places only.** Place name (or city only), city, region, date, a one-line note, and the diorama. Never companions or people. No `with`/`companions`/`people` field exists, and the build fails if one appears. |
| Publish delay | **24 hours, fixed.** Each entry carries a `publishAfter` timestamp. The build drops anything whose `publishAfter` is still in the future. See [Publish delay](#publish-delay). |
| Precision | `precision: place` (public place name + city) or `precision: city` (city only, no place name). No coordinates in Phase 0–1. A later map gets coordinates rounded to 2 decimals (~1 km) at most. |
| Where it lives | Markdown files in `src/checkins/`, one per check-in, same as `src/now-entries/`. Collection `checkins`. |
| Homepage | New `home-section` labelled **last seen**, directly after `#now-preview`. Absent when there are no published check-ins. |
| Timeline | `/checkins/`, linked from the footer `bottom` nav. Top nav stays at four items. |
| Day/night | Two images per entry. The visible one follows `<html data-theme>`, not just `prefers-color-scheme`, because the toggle can disagree with the OS. |
| "N days ago" | Rendered as a plain date at build, rewritten to "N days ago" in the browser. No JS: you see the date. |
| Photos | The original photo is never committed. Only generated dioramas, re-encoded so they carry no EXIF/GPS. |

If any of those is wrong, say so before Phase 0 starts.

---

## This repo (already in place)

| What | Where |
| --- | --- |
| `/now` entries (the pattern to copy) | `src/now-entries/YYYY-MM-DD.md` + `src/now-entries/now-entries.json` (`{"permalink": false}`) |
| `/now` collection | `getNowEntries` in `src/_config/collections.js`, registered in `eleventy.config.js` as `nowEntries` |
| `/now` page | `src/pages/now.njk`: latest entry, then a `<details>` "Previously…" list |
| Date filters | `formatDateUtc` in `src/_config/filters/dates.js` (filename/YAML dates are UTC midnight; this keeps the day from shifting) |
| Drafts | `src/_config/plugins/drafts.js`: `draft: true` is hidden from `npm run build`, shown in `serve`/`watch` |
| Homepage | `src/pages/index.njk`: `home-section` rows; `#now-preview` is the hard-coded "now" blurb; local CSS block (`css/home.css`) and `{% js "defer" %}` block at the bottom |
| Homepage CSS | `src/assets/css/local/home.css` (`.home-section`, `.home-section__label`, `.home-more`) |
| Theme toggle | `src/assets/scripts/bundle/theme-toggle.js`, inlined in `<head>` via `src/_includes/head/js-inline.njk`. Sets `data-theme="light|dark"` on `<html>` before paint, from `localStorage` or `prefers-color-scheme`. |
| Theme tokens | `src/assets/css/global/base/variables.css`: a `prefers-color-scheme: dark` block and a `:root[data-theme='dark']` block |
| Theme-aware precedent | `src/assets/scripts/components/pixel-hero.js` watches `data-theme` with a `MutationObserver` |
| Images | `eleventyImageTransformPlugin` in `eleventy.config.js` turns every `<img>` into `<picture>` (avif/webp/jpeg, 400/800/1200/auto) in `dist/img/`. `src/assets/images/<area>/` is **not** passthrough-copied, only transformed. |
| Footer nav | `src/_data/navigation.js` → `bottom`; rendered by `src/_includes/partials/footer.njk` |
| Page shell | `layout: page` + `src/_includes/partials/page-intro.njk` |
| Netlify | `netlify.toml` (`npm run build` → `dist`, `netlify-plugin-cache` on `.cache`); `netlify/functions/lichess-status.js` (v1 `export async function handler`) |
| Privacy copy | `src/pages/privacy.md` |
| Standing-instruction precedent | `.cursor/rules/chess-page.mdc` ("here's a new study embed") |
| Copy | `docs/site-voice.md` |

Extend these. Do not add a second collection system, a root `_data/`, a JSON check-ins file next to the Markdown, or a new layout.

---

## Standing rules

- One phase per session. Commit at the end. Stop until Stefan says next phase.
- Fit this repo. Input `src/`, data `src/_data/`, pages `src/pages/`, includes `src/_includes/`, local CSS `src/assets/css/local/`, output `dist/`.
- **No people, ever.** Not in front matter, the note, the alt text, or the image. Dioramas are scenery with no figures.
- **Nothing private goes in this repo.** It's public, and so is its history. A private entry never gets written here, not even as a draft. Deleting a file later doesn't un-publish it.
- **No home or school.** If a place is home, a kid's school, daycare, or a relative's home, it doesn't get a check-in. If a place is close enough to home that it narrows things down, use `precision: city`. The list of those places never goes in this repo (a denylist of addresses is itself a leak).
- **No exact coordinates.** None in Phase 0–1. Later, 2 decimal places at most.
- **Images:** generated dioramas only. Re-encode with sharp before committing and check there's no GPS/EXIF (see Phase 1 gotchas).
- **No third-party scripts or map tiles.** CSP and `privacy.md` say what they say for a reason.
- **Don't push a check-in early.** Nothing goes to GitHub (branch, PR, or `main`) before its `publishAfter` has passed, unless Stefan has said repo visibility is fine (open question 1). The build filter protects the site; it can't protect a public repo.
- Copy: `docs/site-voice.md`. Lowercase home label ("last seen"). Direct notes, first person.

---

## Data schema

One file per check-in: `src/checkins/YYYY-MM-DD-slug.md`. The filename date sorts it, like posts. The body is the one-line note.

```yaml
---
date: 2026-10-01                          # local (CT) calendar day of the visit. Display with formatDateUtc.
publishAfter: 2026-10-02T16:00:00-05:00   # visit time + 24h, rounded up to the hour. Offset required.
place: Minnehaha Falls                    # omit when precision is city
city: Minneapolis
region: MN
country: US
precision: place                          # place | city
kind: park                                # optional: park, trail, cafe, venue, airport, city…
image:                                    # optional in Phase 0, needed for the image to show in Phase 1
  day: /assets/images/checkins/2026-10-01-minnehaha-falls-day.webp
  night: /assets/images/checkins/2026-10-01-minnehaha-falls-night.webp
  alt: Clay diorama of a waterfall dropping into a wooded gorge, with a small footbridge
source: hand                              # hand | bot. Lets the Phase 2 bot find its own entries.
draft: false                              # existing drafts plugin
---
First real fall walk. The falls were louder than I expected.
```

`src/checkins/checkins.json` (directory data, same as `now-entries.json`):

```json
{ "permalink": false }
```

**Allowed keys, and nothing else:** `date`, `publishAfter`, `place`, `city`, `region`, `country`, `precision`, `kind`, `image` (`day`, `night`, `alt`), `source`, `draft`. Anything else fails the build. An allowlist is stricter than a list of banned words like `with` or `people`, and it's the thing that makes "the schema has no field for people" true in practice.

**Validation (fails the build, not soft):**

- Unknown key in an entry's own front matter
- `publishAfter` missing, missing a UTC offset, or earlier than the day after `date`
- `precision: city` with a `place`, or `precision: place` without one
- `image` present with only one of `day`/`night`, or without `alt`

A failed Netlify build keeps the last good deploy live, so failing loud here can't take the site down. It just stops a bad entry from shipping. This is different from Lichess, where the site fails soft because the data isn't mine.

Why Markdown and not `src/_data/checkins.yaml`: one new file per check-in means bot PRs never conflict, diffs stay tiny, and it matches `/now` and posts. Stefan uses YAML for books and projects, so that's a fair alternative if he'd rather (open question 6).

---

## Publish delay

Two places can leak a check-in early: the **site** and the **repo**. `publishAfter` handles the first one. A rule handles the second.

### The site: `publishAfter` filtered at build

`getCheckins` in `src/_config/collections.js` keeps an entry only if `publishAfter <= build time`. The homepage section and `/checkins/` both read that collection, so an entry that isn't due yet isn't in `dist/` at all: not in the HTML, not in an image, not in the sitemap. This also covers Netlify deploy previews, which run `npm run build` and are public URLs.

`serve`/`watch` uses the same filter. To see a pending entry locally, temporarily backdate `publishAfter` and don't commit that.

### The repo: don't push before `publishAfter`

The repo is public. A pending entry pushed to any branch or opened as a PR is visible on GitHub right away, `publishAfter` or not, which defeats the point of the delay. So the default rule is: write the file whenever, push it after `publishAfter`. Merging then deploys it immediately, because merges to `main` already trigger a Netlify build.

### Picking up entries that are already merged

If an entry lands on `main` before its `publishAfter` (Stefan relaxes the repo rule, or merges a batch from a trip), nothing rebuilds the site when the delay passes. Today the site only builds on push. Options:

| Option | How | Trade-offs |
| --- | --- | --- |
| **A. Netlify scheduled function → build hook** (recommended) | `netlify/functions/checkins-rebuild.js` POSTs to a Netlify build hook. Hook URL lives in a Netlify env var (`CHECKINS_BUILD_HOOK_URL`), never in the repo. Schedule set in `netlify.toml` (`[functions."checkins-rebuild"] schedule = "0 */6 * * *"`), so no new dependency. | Stays on Netlify next to `lichess-status.js`. No GitHub secrets, no first workflow file. Scheduled functions only run on the published production deploy, so it can't be tested from a deploy preview; use "Run now" in the Netlify UI. Every run is a full build and costs build minutes, even when nothing changed. Bonus: Lichess numbers refresh on the same schedule. |
| B. GitHub Actions cron → build hook | First `.github/workflows/` file, hook URL in a GitHub secret. | Familiar, but GitHub cron is best-effort (runs can lag), and GitHub disables scheduled workflows in public repos after 60 days with no commits. Two places to look when it breaks. |
| C. No schedule | Only merge after `publishAfter`; the merge deploy publishes it. | Zero infrastructure and the best privacy. Relies on getting the timing right every time. This is the default rule anyway. |

**Recommendation:** C as the rule, A as the safety net. Every 6 hours means an already-merged entry appears 24 to 30 hours after the visit. Hourly gets that down to 25 hours but is ~720 builds a month. Daily is cheapest but means up to 48 hours. Measure `npm run build` time in Phase 1b before picking the cadence (open question 3).

**Rejected:** having the build write a "next publish time" file so the function only triggers when something's due. Anyone could read it, and it says a check-in is pending.

---

## Phase 0 — Data, collection, seed entries

Invisible. Nothing on the live site changes.

**Build**

- `src/checkins/checkins.json` with `{"permalink": false}`.
- `getCheckins` in `src/_config/collections.js`, next to `getNowEntries`: glob `./src/checkins/**/*.md`, validate, drop entries whose `publishAfter` is in the future, newest first.
- Validation and the publish filter in one small helper, `src/_config/utils/checkins.js`, so Phase 1 and the Phase 1b function can share the delay logic if needed.
- Register `addCollection('checkins', getCheckins)` in `eleventy.config.js`.
- Two or three seed entries for real past visits Stefan names (open question 5), with `publishAfter` in the past. At least one `precision: city` so both shapes are exercised. If Stefan hasn't named any, use placeholder entries marked `draft: true` so they never reach production.
- `.cursor/rules/checkins.mdc`: the standing instruction "here's a check-in," modeled on the study-embed procedure in `chess-page.mdc`. Schema, file naming, image spec, the privacy rules above, the push-after-`publishAfter` rule, and "open a PR, don't merge." Public-safe content only.

**Endpoints:** none.

**Verify first:** none. No external data.

**Gotchas**

- `item.data` is front matter merged with global data (`collections`, `page`, `meta`, …), so the allowlist check can't use it. Read the entry's own front matter: split the file at the `---` fences and parse it with `js-yaml`, which is already a direct dependency (`gray-matter` is only transitive; don't import it).
- `js-yaml` turns `2026-10-02T16:00:00-05:00` into a `Date`, and a timestamp without an offset is read as UTC. Check for the offset in the raw text before parsing.
- `date: 2026-10-01` becomes UTC midnight. Use `formatDateUtc` everywhere, like `/now`.
- Build time is when the collection runs, not when the deploy goes live. Fine at 24 hours. Don't try to make it to-the-minute.
- The drafts plugin excludes `draft: true` from collections in `npm run build` but not in `serve`. Don't confuse a draft showing locally with the publish filter failing.
- The publish filter lives in `getCheckins`, so a pending entry is still in `collections.all` and `collections.showInSitemap` (with no URL, because `permalink: false`). Templates read check-ins only through `collections.checkins`, never by looping `collections.all`.

**Done when**

- `npm run build` passes, and `collections.checkins` has the published seeds, newest first (log the length once, then remove the log).
- A local entry with `publishAfter` tomorrow isn't in the collection, and `grep -r "<its place name>" dist/` finds nothing. Don't commit it.
- A local entry with a `with:` key, a `publishAfter` without an offset, or `precision: city` plus `place` each fails the build with a message naming the file.
- No new page in `dist/` (no `/checkins/` yet), and the live pages look the same.

---

## Phase 1 — Last seen, `/checkins/`, day/night, days ago

The MVP. Visible.

**Build**

- `src/_includes/partials/checkin-figure.njk`: two `<img>`s (`data-variant="day"` and `"night"`), same `alt`, both `loading="lazy"`, plus the caption line. Skips the images if the entry has none.
- Homepage: in `src/pages/index.njk`, a new `<section class="home-section" id="last-seen" aria-labelledby="home-last-seen">` right after `#now-preview`. Label `last seen`. Body: the figure, then `Last seen at {place} · {city} · <time>`, or `Last seen in {city} · <time>` for city precision. Then `<a class="home-more" href="/checkins/">every check-in →</a>`. Wrapped in `{% if collections.checkins.length %}`.
- `src/pages/checkins.njk`: `permalink: /checkins/index.html`, `layout: page`, `page-intro`. The latest check-in large, then every check-in newest first, grouped by month: date, place · city, the note, a small thumbnail of the variant that matches the theme.
- `src/assets/css/local/checkins.css`: timeline, figure, and the day/night swap. Included via `{% css "local" %}` on both pages (`{% include "css/checkins.css" %}`). Tokens only.
- `src/assets/scripts/bundle/checkin-ago.js`: rewrites `<time data-ago datetime="YYYY-MM-DD">` to "N days ago." Included in the `{% js "defer" %}` block on both pages (`{% include "scripts/checkin-ago.js" %}`).
- Footer: add `{ text: 'Check-ins', url: '/checkins/' }` to `bottom` in `src/_data/navigation.js`.
- `src/pages/privacy.md`: one short paragraph. Check-ins show public places or a city, never people, at least a day late. Images are generated, not photos, and carry no location data. No map scripts.
- Real images for at least one seed entry (open question 4).

**Day/night swap**

`theme-toggle.js` always sets `data-theme` when JS runs, so key the swap off that. `prefers-color-scheme` is only the no-JS fallback. A `<picture><source media="(prefers-color-scheme: dark)">` alone would ignore the toggle.

```css
.checkin-figure img[data-variant='night'] { display: none; }

@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) .checkin-figure img[data-variant='day'] { display: none; }
  :root:not([data-theme]) .checkin-figure img[data-variant='night'] { display: block; }
}

:root[data-theme='dark'] .checkin-figure img[data-variant='day'] { display: none; }
:root[data-theme='dark'] .checkin-figure img[data-variant='night'] { display: block; }
```

No JS listener needed: the toggle changes the attribute, and CSS does the rest.

**Days ago**

- Build output: `<time datetime="2026-10-01" data-ago>on 1 Oct</time>`. That's what no-JS visitors see, and it never goes stale.
- Client: parse `datetime` as a local calendar day (`new Date(y, m - 1, d)`), diff against today's local midnight, `Math.round` the day count (so DST doesn't produce 2.96), format with `Intl.RelativeTimeFormat('en', {numeric: 'always'})`. Under 1 day: leave the date alone. Over 60 days: switch to months (open question 7).

**Endpoints:** none.

**Verify first:** none.

**Gotchas**

- The image transform wraps each `<img>` in `<picture>`, and the attributes stay on the `<img>`. Target `.checkin-figure img`, not `.checkin-figure > img`.
- Browsers don't fetch `loading="lazy"` images that are `display: none`, so only the visible variant downloads. Don't make either image eager: "last seen" sits below the intro, so it isn't the LCP.
- Two `<img>`s with the same alt is fine because `display: none` hides the other from screen readers. Check with the a11y run, not by assumption.
- **EXIF.** The source `.webp` under `src/assets/images/checkins/` is in a public repo even though it isn't passthrough-copied. Re-encode before committing (`sharp(input).rotate().webp({quality: 80})`; sharp drops metadata unless you call `withMetadata()`), then check with `exiftool -a -gps:all <file>` or sharp's `metadata()`. Don't add `src/assets/images/checkins` to the passthrough list.
- Target per variant: 1600px long edge, WebP q≈80, ≤250 KB. eleventy-img makes the smaller sizes.
- Hidden retro skins (`.retro-2005`, `.retro-2006`) sit on the same page. Scope every rule under `.checkin-figure` or `.checkins` so nothing leaks into them.
- The homepage "now" blurb is hard-coded, not from `nowEntries`. Leave it alone. The new section only goes after it.
- `npm run test:a11y` only tests `meta.tests.pa11y.customPaths` in `src/_data/meta.js`. Add `/checkins/` there.

**Done when**

- `/` shows "last seen" right after "now" with the latest published check-in, and the link goes to `/checkins/`.
- With zero published check-ins, the section isn't there and nothing errors.
- `/checkins/` lists every published check-in, newest first, grouped by month. Footer link works on every full page.
- At 390 and 1440, light and dark: the toggle swaps day/night instantly, the OS setting works with JS off, and only one variant is downloaded (check the network panel).
- With JS off, the caption shows the date. With JS on, "N days ago."
- No people anywhere. `privacy.md` updated. `npm run test:a11y` passes.
- No image in `src/assets/images/checkins/` has EXIF/GPS.

## Phase 1b — Scheduled rebuild (optional, small)

Ships on its own once Stefan creates the build hook in the Netlify UI and sets the env var. Skip it if he keeps the push-after-`publishAfter` rule strictly and doesn't want Lichess refreshed on a schedule.

**Build**

- `netlify/functions/checkins-rebuild.js`, same v1 `handler` style as `lichess-status.js`: `fetch(process.env.CHECKINS_BUILD_HOOK_URL, {method: 'POST'})`, log the status, return. Exit quietly if the env var is missing.
- `netlify.toml`: `[functions."checkins-rebuild"]` with `schedule = "0 */6 * * *"` (or whatever cadence Stefan picks).

**Endpoints:** a Netlify build hook (`POST https://api.netlify.com/build_hooks/<id>`). Stefan creates it under Site configuration → Build & deploy → Build hooks. Don't guess the ID or commit it.

**Verify first:** before writing the function, Stefan (or the agent with the URL in a shell env var, not a file) runs `curl -X POST -d '{}' "$CHECKINS_BUILD_HOOK_URL"` once and sees a deploy start in the Netlify UI.

**Gotchas**

- The hook URL is a secret. Anyone who has it can burn build minutes. Env var only.
- Scheduled functions only run on the published production deploy. Test with "Run now" in the Netlify Functions UI after merge.
- Measure `npm run build` on Netlify first. Builds per month × minutes per build has to fit the plan.

**Done when**

- "Run now" starts a production deploy from `main`.
- An entry merged with `publishAfter` a few hours out appears on the live site after the next scheduled run, and not before.

---

## Future (not phases yet)

Out of scope for this plan. Each gets planned when Stefan picks it up.

- **Phase 2 — Check-in bot.** Photo + a short note in chat → place lookup → check against a private denylist (home, schools, relatives) → day and night dioramas generated from the place, not the photo → preview in chat → after `publishAfter`, a branch and PR in this repo → deploy preview → Stefan merges. The original photo and the denylist stay out of this repo. Write path is undecided: a Cursor cloud agent following `.cursor/rules/checkins.mdc` (how PRs land today), or a scoped token. Never auto-merge.
- **Phase 3 — Extras.** A stats line ("14 places, 5 cities in 2026"). A static SVG map generated at build through the existing `{% svg %}`/OG pipeline, with no tiles and no scripts (this is when `coords` gets added, rounded to 2 decimals). "On this day" (client-side from a small embedded list, or the scheduled rebuild). A monthly recap. A Wall post in the retro-2005 skin.
- **Maybe later:** per-entry pages and OG images, a check-ins feed, external image storage if the repo grows past ~150 MB (about 50 MB a year at two check-ins a week).

---

## Open questions for Stefan

1. **Repo visibility vs the delay.** The repo is public, so a check-in pushed to GitHub is visible there immediately, whatever `publishAfter` says. Default: nothing gets pushed until its `publishAfter` has passed. Is that the rule, or is GitHub visibility acceptable as long as the site waits 24 hours?
2. **Delay start.** Is it 24 hours from when you were at the place, or from when you left? Default: from the visit time, rounded up to the hour. Note that `publishAfter` minus 24 hours gives the rough visit time, and that sits in the public repo.
3. **Rebuild cadence.** Ship Phase 1b at all? If so, every 6 hours (entries appear 24–30h after the visit), hourly, or daily? Are Netlify deploy previews on for PRs?
4. **Images for Phase 1.** Until the bot exists, who makes the day/night dioramas, and with what? Should Phase 1 ship with text-only check-ins if no images are ready?
5. **Seed entries.** Which two or three real past visits should Phase 0 seed? Minnehaha Falls from the sketch? If you'd rather not name any yet, they ship as drafts.
6. **Names and format.** `/checkins/` and "last seen" OK, or `/places/` / `/seen/`? Footer label "Check-ins"? One Markdown file per entry (recommended) or a single `src/_data/checkins.yaml`?
7. **Old check-ins.** "214 days ago" reads oddly. Switch to months after 60 days, or show the date past some cutoff?
8. **Notes.** Is the one-line note required, optional, or out? It's the most likely place for a person to slip in.
9. **Private entries.** Not stored here, ever. Should they exist anywhere (a private repo, your notes), or just not get written down? That only matters once the bot exists.
10. **Coordinates.** Leave them out entirely until a map is actually planned (default), or record rounded ones from day one so a map can be backfilled?
11. **Moving overseas in 2027.** Keep `country` required from day one (default), so a world map and stats work later without a migration?
