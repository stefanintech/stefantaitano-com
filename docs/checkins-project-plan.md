# Check-ins — Project plan

A "last seen" line on the homepage and a `/checkins/` timeline of public places I've been. Text first; the day/night clay dioramas come later with the check-in bot. One visible slice per session.

**Status (1 Oct 2026):** Phases 0 and 1 landed. Phase 0: `src/checkins/`, the `checkins` collection with front-matter validation and the `publishAfter` filter, the Skull Hollow Nature Trail seed, one draft test entry, and `.cursor/rules/checkins.mdc`. Phase 1 (text-only): "last seen" on the homepage, `/checkins/` grouped by month, client-side "N days ago" for 1–60 days, the footer link, and the privacy paragraph. Phase 2 (site side of images) is in review: the optional `image: {day, night, alt}` key, the day/night swap on both pages, `npm run checkins:images`, and the build-time image checks. The bot and everything after it are future work.

**Outcome:** The homepage shows `Last seen at Skull Hollow Nature Trail · Oologah · 3 days ago` (or the date, once a check-in is more than 60 days old) right after the "now" blurb. It links to `/checkins/`, a reverse-chronological list of check-ins. Nothing about a check-in reaches GitHub or the site until at least 24 hours after I was there. No people, no home, no school, no coordinates, no third-party scripts.

**Cut**

- People of any kind: companions, "with family," names, faces. The schema has no field for them.
- Private or family-only entries, here or anywhere else. They aren't stored at all for now.
- Coordinates, home, kids' schools, daycare, relatives' homes
- Live location, or anything that says where I am right now
- Third-party maps, tiles, or map scripts (Leaflet, Mapbox, Google Maps)
- Images in Phase 0–1. Phase 2 adds them on the site side; generating them is the bot's job.
- A scheduled rebuild. Pushes wait 24 hours, so merge deploys are enough.
- Per-check-in pages, OG images, and a check-ins feed (later, maybe)
- The check-in bot, stats, map, "on this day," monthly recaps (future only)
- Changing the hand-written homepage "now" blurb or `/now` itself
- A fifth top-nav item. The link goes in the footer.

---

## Decisions

| Question | Call (1 Oct 2026) |
| --- | --- |
| What gets shown | **Places only.** Place name (or city only), city, date, and an optional one-line note. Never companions or people. No `with`/`companions`/`people` field exists, and the build fails if one appears. |
| When it reaches GitHub | **Nothing is pushed until 24 hours after the visit.** No branch, no PR, no commit to `main` before then. This is the rule, not a default. The repo is public, so pushing early would publish the check-in on GitHub even if the site waited. |
| When the 24 hours starts | **At the visit, rounded up to the hour.** A 2:20 PM visit gets `publishAfter` 3:00 PM the next day. |
| How it reaches the site | The merge deploy, which runs after the push and so after the delay. `publishAfter` is also filtered at build as a backstop in case something gets pushed early. |
| Scheduled rebuild | **None.** Pushes wait, so a merge deploy always happens after the delay. See the future note at the end. |
| Deploy previews | **On.** Checked 1 Oct: PR #39 has a passing `netlify/stefantaitano/deploy-preview` check (`deploy-preview-39--stefantaitano.netlify.app`). `netlify.toml` has no `[context.deploy-preview]` overrides, so previews run the same `npm run build` as production: drafts hidden, `publishAfter` filter on. Preview URLs are public, which is fine because the PR only exists after the delay. |
| Images | **None in Phase 1.** Ships text-only. **Phase 2 adds the site side** (schema key, day/night swap, encoder script, build checks) before the bot, so the bot only has to produce two files and three lines of front matter. Contract: `src/assets/images/checkins/<slug>-day.webp` and `-night.webp`, WebP q≈80, exactly 1600×1067, ≤250 KB each, no EXIF/XMP/GPS. Alt describes the scene, never people. |
| Precision | `precision: place` (public place name + city) or `precision: city` (city only, no place name). |
| Coordinates | **Not in the schema.** Added only when a map is planned, at 2 decimals (~1 km) at most. |
| Country | **Required from day one** (ISO 3166-1 alpha-2, e.g. `US`), ahead of moving overseas in 2027. |
| Note | **Optional.** The Markdown body. Empty is fine. |
| Private entries | **Not stored anywhere** for now. |
| Format | **One Markdown file per entry** in `src/checkins/`, the same pattern as `src/now-entries/`. Collection `checkins`. |
| Names | URL `/checkins/`. Homepage label **`last seen`**, lowercase like every other home label (confirmed by Stefan 1 Oct). The line itself reads "Last seen at …". Footer link `Check-ins`. |
| Homepage placement | New `home-section` directly after `#now-preview`. Absent when there are no published check-ins. |
| Footer | `/checkins/` in the footer `bottom` nav. Top nav stays at four items. |
| "N days ago" | Up to 60 days: "N days ago." After 60 days: the date. The date is rendered at build; the browser swaps in "N days ago" only inside the 60-day window. No JS: the date. |
| Seed entries | **One real seed: Skull Hollow Nature Trail** (Oologah, OK, US), visited Sunday 31 Mar 2024 at 2:13 PM CT. `publishAfter` is 3:00 PM CT on 1 Apr 2024, so it can be pushed right away. City-level location only. It gets a one-line placeholder note Stefan can edit. Any other seeds are `draft: true` and never reach production. |

---

## This repo (already in place)

| What | Where |
| --- | --- |
| `/now` entries (the pattern to copy) | `src/now-entries/YYYY-MM-DD.md` + `src/now-entries/now-entries.json` (`{"permalink": false}`) |
| `/now` collection | `getNowEntries` in `src/_config/collections.js`, registered in `eleventy.config.js` as `nowEntries` |
| `/now` page | `src/pages/now.njk`: latest entry, then a `<details>` "Previously…" list |
| Date filters | `formatDateUtc` in `src/_config/filters/dates.js` (filename/YAML dates are UTC midnight; this keeps the day from shifting) |
| Drafts | `src/_config/plugins/drafts.js`: `draft: true` is hidden from `npm run build` (production and deploy previews), shown in `serve`/`watch` |
| Homepage | `src/pages/index.njk`: `home-section` rows; `#now-preview` is the hard-coded "now" blurb; local CSS block (`css/home.css`) and `{% js "defer" %}` block at the bottom |
| Homepage CSS | `src/assets/css/local/home.css` (`.home-section`, `.home-section__label`, `.home-more`) |
| Theme toggle | `src/assets/scripts/bundle/theme-toggle.js`, inlined in `<head>` via `src/_includes/head/js-inline.njk`. Sets `data-theme="light|dark"` on `<html>` before paint. Not touched in Phase 0–1. |
| Theme tokens | `src/assets/css/global/base/variables.css` |
| Footer nav | `src/_data/navigation.js` → `bottom`; rendered by `src/_includes/partials/footer.njk` |
| Page shell | `layout: page` + `src/_includes/partials/page-intro.njk` |
| Accessibility test paths | `meta.tests.pa11y.customPaths` in `src/_data/meta.js` |
| Netlify | `netlify.toml` (`npm run build` → `dist`, no `[context]` overrides); deploy previews on for PRs |
| Privacy copy | `src/pages/privacy.md` |
| Standing-instruction precedent | `.cursor/rules/chess-page.mdc` ("here's a new study embed") |
| Copy | `docs/site-voice.md` |

Extend these. Do not add a second collection system, a root `_data/`, a JSON check-ins file next to the Markdown, or a new layout.

---

## Standing rules

- One phase per session. Commit at the end. Stop until Stefan says next phase.
- Fit this repo. Input `src/`, data `src/_data/`, pages `src/pages/`, includes `src/_includes/`, local CSS `src/assets/css/local/`, output `dist/`.
- **Nothing reaches GitHub until 24 hours after the visit.** No branch, PR, or commit before `publishAfter` has passed. Check the clock before `git push`, not after.
- **No people, ever.** Not in front matter or in the note.
- **Nothing private is stored.** Not in this repo (it's public, and so is its history; deleting a file later doesn't un-publish it), and nowhere else for now.
- **No home or school.** If a place is home, a kid's school, daycare, or a relative's home, it doesn't get a check-in. If a place is close enough to home that it narrows things down, use `precision: city`. The list of those places never goes in this repo (a denylist of addresses is itself a leak).
- **No coordinates.** The schema doesn't have them.
- **No third-party scripts or map tiles.** CSP and `privacy.md` say what they say for a reason.
- Copy: `docs/site-voice.md`. Direct notes, first person.

---

## Data schema

One file per check-in: `src/checkins/YYYY-MM-DD-slug.md`. The filename date sorts it, like posts. The body is the optional one-line note.

The example is the real Phase 0 seed, `src/checkins/2024-03-31-skull-hollow-nature-trail.md`. Visit: Sunday, 31 Mar 2024, 2:13 PM Central (CDT, UTC−5). Rounded up to 3:00 PM, plus 24 hours: 3:00 PM CDT on 1 Apr 2024.

```yaml
---
date: 2024-03-31                          # local (CT) calendar day of the visit. Display with formatDateUtc.
publishAfter: 2024-04-01T15:00:00-05:00   # visit time rounded up to the hour, plus 24h. Offset required.
place: Skull Hollow Nature Trail          # omit when precision is city
city: Oologah
region: OK                                # optional
country: US                               # required, ISO 3166-1 alpha-2
precision: place                          # place | city
kind: trail                               # optional: park, trail, cafe, venue, airport, city…
source: hand                              # optional: hand | bot. Lets the future bot find its own entries.
draft: false                              # existing drafts plugin
---
A quiet trail through the woods outside town.
```

The note is a **placeholder**. Stefan can rewrite or delete it before Phase 0 merges; if he doesn't, it ships as written. Location stays at city level: place name, `Oologah, OK`, `US`. No coordinates, trailhead, parking, or directions, in the front matter or the note.

Central time is `-05:00` during daylight saving time (March to early November) and `-06:00` the rest of the year. Use the offset in effect on the visit date.

`src/checkins/checkins.json` (directory data, same as `now-entries.json`):

```json
{ "permalink": false }
```

**Required:** `date`, `publishAfter`, `city`, `country`, `precision`, plus `place` when `precision: place`.

**Allowed keys, and nothing else:** `date`, `publishAfter`, `place`, `city`, `region`, `country`, `precision`, `kind`, `source`, `draft`, and (from Phase 2) `image`. Anything else fails the build. An allowlist is stricter than a list of banned words like `with` or `people`, and it's what makes "the schema has no field for people" true in practice. `coords` isn't on it; it gets added in the phase that needs it.

**`image` (optional, Phase 2):** `{day, night, alt}`, all three or none. See [Phase 2](#phase-2--images-site-side).

**Validation (fails the build, not soft):**

- Unknown key in an entry's own front matter
- A required key missing, or `country` not two uppercase letters
- `publishAfter` missing a UTC offset, not on the hour, or earlier than the day after `date`
- `precision: city` with a `place`, or `precision: place` without one

A failed Netlify build keeps the last good deploy live, so failing loud here can't take the site down. It just stops a bad entry from shipping. This is different from Lichess, where the site fails soft because the data isn't mine.

---

## Publish delay

Two places can leak a check-in early: the **repo** and the **site**.

**The repo (the rule).** Nothing is pushed until `publishAfter` has passed: visit time rounded up to the hour, plus 24 hours. Write the file whenever, push it later. Then PR, deploy preview, merge. The merge deploy publishes it right away, because merges to `main` already trigger a Netlify build. This is the real protection. Deploy previews are public URLs too, and they only exist once a PR does.

**The site (the backstop).** `getCheckins` in `src/_config/collections.js` keeps an entry only if `publishAfter <= build time`. If something is pushed early by mistake, the site and its deploy preview still leave it out, but GitHub has already shown it. Treat that as a broken rule, not a working delay. Without a scheduled rebuild, an entry merged before its `publishAfter` appears on the next deploy, whenever that is.

`serve`/`watch` uses the same filter. To see a pending entry locally, temporarily backdate `publishAfter` and don't commit that.

---

## Phase 0 — Data, collection, seed entry

Invisible. Nothing on the live site changes.

**Build**

- `src/checkins/checkins.json` with `{"permalink": false}`.
- `getCheckins` in `src/_config/collections.js`, next to `getNowEntries`: glob `./src/checkins/**/*.md`, validate, drop entries whose `publishAfter` is in the future, newest first.
- Validation and the publish filter in one small helper, `src/_config/utils/checkins.js`.
- Register `addCollection('checkins', getCheckins)` in `eleventy.config.js`.
- The real seed: `src/checkins/2024-03-31-skull-hollow-nature-trail.md`, exactly as in [Data schema](#data-schema), placeholder note included unless Stefan has edited it.
- If a second entry is useful for testing (for example a `precision: city` one), it gets `draft: true`. Drafts never reach production or deploy previews.
- `.cursor/rules/checkins.mdc`: the standing instruction "here's a check-in," modeled on the study-embed procedure in `chess-page.mdc`. It covers the schema, file naming, the privacy rules, the 24-hour push rule ("don't push until `publishAfter` has passed; if it hasn't, say when it will and stop"), and "open a PR, don't merge." Public-safe content only.

**Endpoints:** none.

**Verify first:** none. No external data.

**Gotchas**

- `item.data` is front matter merged with global data (`collections`, `page`, `meta`, …), so the allowlist check can't use it. Read the entry's own front matter: split the file at the `---` fences and parse it with `js-yaml`, which is already a direct dependency (`gray-matter` is only transitive; don't import it).
- `js-yaml` turns `2024-04-01T15:00:00-05:00` into a `Date`, and a timestamp without an offset is read as UTC. Check for the offset in the raw text before parsing.
- `date: 2024-03-31` becomes UTC midnight. Use `formatDateUtc` everywhere, like `/now`.
- The drafts plugin excludes `draft: true` from collections in `npm run build` but not in `serve`. Don't confuse a draft showing locally with the publish filter failing.
- The publish filter lives in `getCheckins`, so a pending entry is still in `collections.all` and `collections.showInSitemap` (with no URL, because `permalink: false`). Templates read check-ins only through `collections.checkins`, never by looping `collections.all`.
- The seed is a past visit, so its `publishAfter` is already in the past and it can be pushed straight away.

**Done when**

- `npm run build` passes, and `collections.checkins` has exactly the Skull Hollow Nature Trail seed (log the length once, then remove the log).
- A local entry with `publishAfter` tomorrow isn't in the collection, and `grep -r "<its place name>" dist/` finds nothing. Don't commit it.
- A local entry with a `with:` key, a `coords:` key, a missing `country`, a `publishAfter` without an offset, or `precision: city` plus `place` each fails the build with a message naming the file.
- No new page in `dist/` (no `/checkins/` yet), and the live pages look the same.

---

## Phase 1 — Last seen, `/checkins/`, days ago (text-only)

The MVP. Visible. No images.

**Build**

- `src/_includes/partials/checkin-line.njk`: one check-in as a line. `Last seen at {place} · {city} · <time>`, or `Last seen in {city} · <time>` for city precision. The note goes underneath if there is one. Used on both pages.
- Homepage: in `src/pages/index.njk`, a new `<section class="home-section" id="last-seen" aria-labelledby="home-last-seen">` right after `#now-preview`. Label `last seen`. Body: the line, then `<a class="home-more" href="/checkins/">every check-in →</a>`. Wrapped in `{% if collections.checkins.length %}`. Reuses `home.css`; add rules there only if the line needs them.
- `src/pages/checkins.njk`: `permalink: /checkins/index.html`, `layout: page`, `page-intro`. Every check-in newest first, grouped by month: date, place · city, the note if there is one.
- `src/assets/css/local/checkins.css`: the timeline only. Included via `{% css "local" %}` on `/checkins/`. Tokens only.
- `src/assets/scripts/bundle/checkin-ago.js`: rewrites `<time data-ago datetime="YYYY-MM-DD">` to "N days ago" when the check-in is 1–60 days old. Included in the `{% js "defer" %}` block on both pages (`{% include "scripts/checkin-ago.js" %}`).
- Footer: add `{ text: 'Check-ins', url: '/checkins/' }` to `bottom` in `src/_data/navigation.js`.
- `src/pages/privacy.md`: one short paragraph. Check-ins show public places or a city, never people, at least a day late, with no map scripts. The image sentence waits for the bot phase.
- `meta.tests.pa11y.customPaths` in `src/_data/meta.js`: add `/checkins/`.

**Days ago**

- Build output: `<time datetime="2024-03-31" data-ago>31 Mar 2024</time>`. That's what no-JS visitors see, it never goes stale, and it's also the after-60-days display, so that case needs no JS.
- Client: parse `datetime` as a local calendar day (`new Date(y, m - 1, d)`), diff against today's local midnight, `Math.round` the day count (so DST doesn't produce 2.96). If the result is 1–60, replace the text with `Intl.RelativeTimeFormat('en', {numeric: 'always'})` ("1 day ago," "60 days ago"). Otherwise leave the date.
- Keep `datetime` and the visible date in the same format everywhere so the two pages agree.

**Endpoints:** none.

**Verify first:** none.

**Gotchas**

- Hidden retro skins (`.retro-2005`, `.retro-2006`) sit on the homepage. Scope any new rule under `#last-seen` or `.checkins` so nothing leaks into them.
- The homepage "now" blurb is hard-coded, not from `nowEntries`. Leave it alone. The new section only goes after it.
- A visitor ahead of Central time could, in theory, be on a "today" that's the visit date. The 24-hour rule makes that close to impossible; the 1-day floor covers it anyway.
- The note is optional. Don't render an empty `<p>`.

**Done when**

- `/` shows "last seen" right after "now" with `Last seen at Skull Hollow Nature Trail · Oologah · 31 Mar 2024` (more than 60 days old, so the date shows, not "N days ago"), and the link goes to `/checkins/`.
- With zero published check-ins, the section isn't there and nothing errors.
- `/checkins/` lists every published check-in, newest first, grouped by month. The footer link works on every full page.
- With JS off, both pages show the date. With JS on, an entry within 60 days shows "N days ago" and an older one shows the date (test by backdating locally).
- 390 and 1440, light and dark: readable, no overflow.
- No people anywhere. `privacy.md` updated. `npm run test:a11y` passes, including `/checkins/`.
- Deploy preview for the Phase 1 PR shows the same thing as local.

---

## Phase 2 — Images (site side)

Optional day and night images on a check-in, shown to match the theme. This phase is the site only: the schema, the templates, the encoder script, and the build checks. How the bot writes files and opens PRs is out of scope; it gets planned on its own. No real check-in gets an image in this phase.

**Image contract**

- Files: `src/assets/images/checkins/<slug>-day.webp` and `<slug>-night.webp`. The slug is the entry's filename without `.md`, e.g. `2024-11-29-minnehaha-falls`.
- WebP, q≈80, landscape 3:2, exactly 1600×1067. Day and night are the same size. ≤250 KB each (checked as 250,000 bytes). No EXIF, XMP, or GPS.
- Front matter: `image: { day: <slug>-day.webp, night: <slug>-night.webp, alt: "…" }`. Alt describes the scene, never people.

**Build**

- `src/_config/utils/checkins.js`: `image` joins the allowlist. `day`, `night`, and `alt` are required together, no other subkeys, file names must match the slug, and both files must exist. A partial `image` fails the build. Entries without `image` are unchanged.
- Same file: `validateCheckinImages()` checks every file in `src/assets/images/checkins/`. It fails on non-WebP files, anything over 250,000 bytes, any size other than 1600×1067, or EXIF/XMP in the file (sharp `metadata()`, so it runs on Netlify). Where `exiftool` is installed, it also runs `exiftool -json -a -gps:all` and fails on any GPS tag. `getCheckins` runs it, so `npm run build` enforces it.
- `src/_config/setup/checkin-images.js` + `npm run checkins:images -- <slug> <day-source> <night-source>`: sharp, `rotate()` to apply orientation, cover-crop to 1600×1067, WebP q80 (q75, then q70 only if needed to fit), no metadata. `-- --check` runs the folder check on its own.
- `src/_includes/partials/checkin-figure.njk`: two `<img data-variant="day|night">` with `width="1600" height="1067" loading="lazy" decoding="async"`. Included by `checkin-line.njk`, so the homepage "last seen" and `/checkins/` both get it.
- `src/assets/css/local/checkin-figure.css`: night hidden by default. `:root[data-theme='light']` shows day, `:root[data-theme='dark']` shows night. With JS off, `@media (prefers-color-scheme: dark)` on `:root:not([data-theme])` shows night. Included in the local CSS block on both pages.
- `src/pages/privacy.md` and `.cursor/rules/checkins.mdc`: where images go, naming, the spec, and the GPS rule.
- A `draft: true` test entry with generated placeholder DAY/NIGHT images. It never reaches production or `dist/`.

**Endpoints:** none.

**Verify first:** none. No external data.

**Gotchas**

- The eleventy-img transform wraps each `<img>` in a `<picture>` and re-encodes it into `/img/`. It keeps `data-variant`, `width`, `height`, and `loading` on the `<img>`. `.checkin-figure picture { display: contents }` keeps the CSS swap targeting the `<img>`.
- `src/assets/images/checkins/` isn't passthrough-copied. Only files referenced by a published entry reach `dist/` (as `/img/…`), but every committed file is public in the repo, so the build checks the whole folder, not just referenced files.
- Chrome doesn't fetch a `loading="lazy"` image that's `display: none`, so with JS on only the visible variant downloads. With JS off, browsers turn off lazy loading (a tracking guard), so both variants download. The right one still shows.
- With several files, `exiftool -a -gps:all` prints headers and "N image files read" even with no GPS. Parse `-json` output instead.
- Netlify has no exiftool. The sharp check alone fails on any EXIF block, which is where GPS lives.

**Done when**

- An entry without `image` renders exactly as before.
- A partial `image`, a wrong file name, a missing file, a non-WebP file, a file over 250,000 bytes, a file that isn't 1600×1067, or a file with EXIF/GPS each fails `npm run build` with a message naming the file.
- With the test entry un-drafted locally: `/` and `/checkins/` show the day image in light and the night image in dark, at 390 and 1440, with no overflow and CLS 0. With JS off, the image follows `prefers-color-scheme`.
- With JS on, only the visible variant is requested. Toggling the theme fetches the other one then.
- With the test entry as a draft, `npm run build` passes and `grep -r "Image Test Placeholder" dist/` finds nothing.
- `npm run checkins:images` makes files that pass the check, from a source with GPS. `npm run test:a11y` passes.

---

## Future (not phases yet)

Out of scope for this plan. Each gets planned when Stefan picks it up.

- **Check-in bot.** Photo + a short note in chat → place lookup → check against a private denylist (home, schools, relatives) → day and night dioramas generated from the place, not the photo, with no people in them → preview in chat → wait until `publishAfter` → branch and PR in this repo → deploy preview → Stefan merges. The original photo and the denylist stay out of this repo. Write path is undecided: a Cursor cloud agent following `.cursor/rules/checkins.mdc` (how PRs land today), or a scoped token. Never auto-merge. It writes images through `npm run checkins:images` to the [Phase 2](#phase-2--images-site-side) contract.
  - **Size:** about 50 MB a year at two check-ins a week and ≤250 KB per variant. Revisit at ~150 MB.
- **Phase 3: extras.** A stats line ("14 places, 5 cities in 2026"). A static SVG map generated at build through the existing `{% svg %}`/OG pipeline, with no tiles or scripts. That's when `coords` gets added, at 2 decimals at most. "On this day." A monthly recap. A Wall post in the retro-2005 skin.
- **Scheduled rebuild, only if the push rule ever changes.** If entries ever land on `main` before `publishAfter`, the cheapest pickup is a Netlify scheduled function that POSTs to a build hook. Keep the hook URL in a Netlify env var and the schedule in `netlify.toml`, which beats a GitHub Actions cron: GitHub cron runs can lag, and GitHub disables them in public repos after 60 days without commits. Not needed while pushes wait.
- **Maybe later:** per-entry pages and OG images, a check-ins feed, external image storage.

---

## Unresolved

- **Seed note wording.** The Skull Hollow note is a placeholder. Stefan can edit it before Phase 0 merges, or leave it.
