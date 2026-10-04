# Check-ins city map — Project plan

A clay relief map on `/checkins/` with one marker per city I've checked in from, plus a plain city list that works without the map. Design option A (clay relief) is approved. It ships as four PRs, one per session.

**Status (4 Oct 2026):** PR 1 (data pipeline and city list) is in review. PRs 2–4 are future work.

**Outcome:** `/checkins/` lists every city with published check-ins, each with a `#city-…` anchor, a count, and links down to its check-ins in the timeline. Later PRs draw the same cities on a clay relief map. Home-area cities never appear in the list, on the map, or in the repo's data.

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
- `tier` is `metro` or `town`. PR 2 uses it to snap small towns to a coarser grid.
- Only cities with published, non-excluded check-ins get an entry. **Excluded cities never get a centroid**, and the build fails if one matches `CHECKIN_MAP_EXCLUDE`. That error doesn't say which entry matched.
- A published, non-excluded check-in whose city has no centroid fails the build and names the file. So does an ambiguous match: a check-in without a region whose city exists in two regions, or two keys that normalize to the same city.

**Output.** `src/_includes/partials/checkin-cities.njk`, rendered by `src/pages/checkins.njk` above the timeline. Cities sort by name. Each check-in in the timeline gets an opaque `checkin-<hash>` id, so links carry no dates.

**Tests.** `npm run test:checkins` (`node --test`) builds a fixture site in `test/fixtures/checkin-map/` with made-up cities. It checks that drafts, future entries, excluded cities, and alias spellings never show up, that a missing centroid fails the build, and that the output has no coordinates or dates. `npm run build` runs it first, so Netlify runs it on every deploy.

**Done when:** `/checkins/` shows the city list (with the variable set), the fixture tests pass in `npm run build`, and production fails without the variable.

---

## Later PRs

- **PR 2:** the clay relief map as a build-time SVG, with markers projected from centroids. Small towns snap to a coarser grid by `tier`.
- **PR 3 and PR 4:** finish the map's styling and interaction, following the approved design. Plan each one with Stefan before it starts.
