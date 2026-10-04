# Check-ins city map — Project plan

A clay relief map on `/checkins/` with one marker per city I've checked in from, plus a plain city list that works without the map. Design option A (clay relief) is approved. It ships as four PRs, one per session.

**Status (4 Oct 2026):** PRs 1–3 are merged. PR 4 (scheduled rebuild) is in review.

**Outcome:** `/checkins/` lists every city with published check-ins, each with a `#city-…` anchor, a count, and links down to its check-ins in the timeline, and draws those cities on a clay relief map. Home-area cities never appear in the list, on the map, or in the repo's data.

**Cut**

- Coordinates in HTML, JSON, or any feed. The page gets city labels, counts, and anchors. The map (PR 2+) gets projected SVG x/y only.
- A JSON or GeoJSON feed of check-ins or cities
- Dates, "latest," or "last seen" in the map or city list. The timeline already covers recency.
- Geocoding, at build or by hand from an API. Centroids are typed in from well-known public values.
- New check-in front-matter keys. The map reads `city`, `region`, `country`, `place`, `precision`, and `kind` only.
- Third-party maps, tiles, or map scripts

---

## Data rules (PR 1)

**Source.** Only the filtered `checkins` collection (`getCheckins` in `src/_config/collections.js`): drafts removed, `publishAfter <= build time`. Nothing reads `src/checkins/` directly. `buildCheckinCities` drops drafts and future entries a second time as a backstop.

**Exclusions: `CHECKIN_MAP_EXCLUDE`.** Home-area cities and places are listed only in this Netlify environment variable. They are never in the repo, tests, comments, PRs, or build logs. The build never logs the list or echoes an entry, and error messages give the entry number only.

Format: entries separated by `;` or newlines. Each entry is

```txt
City|Region|Country
City|Region|Country|Place
```

- An empty field or `*` matches anything (`Exampleton||` matches any Exampleton). An entry that is all wildcards fails the build.
- Matching is normalized. Case, accents, and punctuation are ignored, and `St.`/`Ste.`/`Mt.`/`Ft.` match `Saint`/`Sainte`/`Mount`/`Fort`. Full US state names match their two-letter codes, and `USA`/`United States` match `US`.
- A city-only entry also hides a place with that name, in any city.
- If a check-in has no region, an entry with a region still matches it. Missing data excludes; it never slips through.

Example with made-up values:

```txt
Testville|ZZ|ZZ; Saint Testville|ZZ|ZZ; Fakeburg|ZZ|ZZ|Example Pier
```

| Build | Variable missing |
| --- | --- |
| Production (`CONTEXT=production`) | **Build fails.** |
| Deploy preview, branch deploy, local | Warns once and **leaves out the city list**, so an unfiltered list never reaches a public preview. Set the variable for those contexts in Netlify too if previews should show the list. |

**Centroids: `src/_data/cityCentroids.json`.** Keyed by `City|Region|Country`, the same spelling as the check-ins.

```json
{
  "Exampleton|ZZ|ZZ": {"lat": 12.3, "lon": -45.6, "tier": "metro"}
}
```

- `lat` and `lon` come from a well-known public city centroid (the city's Wikipedia coordinates), rounded to 0.1° (about 11 km). Only `lat`, `lon`, and `tier` are allowed.
- `tier` is `metro` or `town`. A town with fewer than 2 published check-ins is drawn on the nearest metro bead (see PR 2).
- Only cities with published, non-excluded check-ins get an entry. **Excluded cities never get a centroid**, and the build fails if one matches `CHECKIN_MAP_EXCLUDE`. That error doesn't say which entry matched.
- A published, non-excluded check-in whose city has no centroid fails the build and names the file. So does an ambiguous match: a check-in without a region whose city exists in two regions, or two keys that normalize to the same city.

**Output.** `src/_includes/partials/checkin-cities.njk`, rendered by `src/pages/checkins.njk` above the timeline. Cities sort by name. Each check-in in the timeline gets an opaque `checkin-<hash>` id, so links carry no dates.

**Tests.** `npm run test:checkins` (`node --test`) builds a fixture site in `test/fixtures/checkin-map/` with made-up cities. It checks that drafts, future entries, excluded cities, and alias spellings never show up, that a missing centroid fails the build, and that the output has no coordinates or dates. `npm run build` runs it first, so Netlify runs it on every deploy.

**Done when:** `/checkins/` shows the city list (with the variable set), the fixture tests pass in `npm run build`, and production fails without the variable.

---

## SVG map (PR 2)

`src/_includes/partials/checkin-map.njk` draws the same grouped cities as an inline SVG above the list. The list stays the text alternative, and every bead is an `<a>` to that city's `#city-…` anchor, so the map works with no JavaScript.

- **Outline:** `src/_data/checkinMapOutline.json`, the contiguous US plus DC, from Natural Earth 1:110m (public domain, release v5.1.2). `npm run checkins:map-outline` rebuilds it from that pinned file and checks the sha256. The site build never downloads it. Alaska, Hawaii, and check-ins outside this outline stay in the list only.
- **Projection:** Albers, shared by `src/_config/utils/map-projection.js`, so beads land on the shapes. The HTML gets whole-number SVG x/y. It does not get latitudes, longitudes, dates, or routes.
- **Small towns:** a `town` with fewer than 2 published check-ins is drawn on the nearest `metro` bead. The bead's name says "near" that metro, and its label names every city on it. The list below still names the town itself. A town with 2 or more check-ins gets its own bead.
- **Beads:** radius grows with the count, capped, and the hit target is at least 44 units in the 960-wide viewBox. The accessible name is "City, Region: N check-ins".

**Done when:** the map is usable from the keyboard and with JavaScript off, axe reports no violations on `/checkins/`, and the page makes no third-party requests.

## Theme and polish (PR 3)

The map uses the same colour tokens as the rest of the site, including `prefers-color-scheme` and the theme switch.

- **Beads.** The rim is amber on the light land and gold on the dark land. Those are the pairs that clear 3:1. The gold highlight stays in the middle of the light bead, where it is not the edge.
- **Labels.** Text on the page background, in both themes, clears 4.5:1.
- **Focus.** A 3px ring in the text colour, outside the 44px hit target.
- **Motion.** The only transition is on the label background, and only when `prefers-reduced-motion` is not set. The site-wide reset already cuts transitions short.
- **Small screens.** The frame is padded by half a hit target so a bead on the coast is not clipped, and a long name ellipsizes before it widens the page. The target stays at least 44px.

**Done when:** contrast holds in both themes, focus is visible, and the mobile target is at least 44px.

## Scheduled rebuild (PR 4)

`netlify/functions/checkin-rebuild.js` POSTs to a Netlify build hook so a check-in already on `main` goes live once `publishAfter` has passed, without another commit. The `publishAfter` filter is still the gate. The 24-hour push rule still applies: nothing is committed before `publishAfter`. The hourly run is only a backstop for an entry that reached `main` early.

- **Schedule:** `@hourly` in `netlify.toml` (`0 * * * *`, minute 0 UTC). The schedule lives only in `netlify.toml`. Netlify runs it for published production deploys. Deploy previews do not fire it on their own. The Netlify UI "Run now" button can invoke it, including on a preview.
- **Hook URL:** `CHECKIN_REBUILD_HOOK_URL`, read when the function runs. In Netlify, set it with Functions scope (or All) for Production. Add Deploy Previews too if "Run now" on a preview should rebuild. Create the hook under Site configuration → Build & deploy → Continuous deployment → Build hooks. The value is never committed, logged, or echoed. A missing or blank value logs a short warning that names the variable and skips the POST. A failed POST logs a status code or a fixed failure line, never the URL or the error message, because fetch errors include the URL.
- **Tests:** `test/checkin-rebuild.test.js` mocks `fetch`. `npm run test:checkins` runs it with the map tests. The map fixture tests still prove a future `publishAfter` stays off the page until a build runs after that time.

**Done when:** a future fixture appears only after its `publishAfter` passes and the next scheduled build runs, and no secrets are in the repo or client.
