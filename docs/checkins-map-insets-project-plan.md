# Check-ins map insets — Project plan

Alaska and Hawaii sit on the `/checkins/` clay map as small inset frames, and a later world view can add a country without a new map renderer. The lower 48 keeps the outline, projection, and bead positions it has today.

**Status (4 Nov 2026):** Phase 1 is the Alaska and Hawaii insets. Phase 2 is not started. Do not build Phase 2 until Stefan picks an option.

**Outcome:** A check-in's `country` and `region` choose a frame. Each frame has its own outline, extent, and Albers projection. Phase 1 draws three frames in one US composition: the contiguous states, Alaska, and Hawaii. Phase 2 is the world view for check-ins outside the US.

**Cut**

- A new layout, a tile service, or a client-side map library
- Coordinates, dates, or routes in the HTML. The page still gets labels, counts, anchors, and projected x/y
- Geocoding. Centroids stay hand-entered public values, rounded to 0.1°
- A world map, a country card, or a US / World toggle in Phase 1
- Clustering beyond the rule already shipped: a town with fewer than 2 check-ins shares the nearest metro bead
- Home-area places. `CHECKIN_MAP_EXCLUDE` still applies, and it is never printed or committed

---

## This repo (already in place)

Extend these. Do not add a second map stack.

| What | Where it lives |
| --- | --- |
| City list and bead grouping | `src/_config/utils/checkin-map.js` |
| Albers fit | `src/_config/utils/map-projection.js` |
| Outline | `src/_data/checkinMapOutline.json`, rebuilt by `npm run checkins:map-outline` |
| Outline script | `src/_config/setup/checkin-map-outline.js` |
| Map markup | `src/_includes/partials/checkin-map.njk` |
| Page | `src/_includes/rasa/checkins.njk` passes `checkinMapOutline` through the `checkinMap` filter |
| CSS | `src/assets/css/rasa/checkins.css`, inlined with the `rasa` bucket |
| Centroids | `src/_data/cityCentroids.json` |
| Tests | `test/checkin-map.test.js` |

The original map plan stays in `docs/checkins-map-project-plan.md`. Exclusions, the publish filter, and the city list rules there still apply.

## Frames

`checkinMapOutline.json` holds one `frames` entry per drawn region. The contiguous states are `id: "us"`, `role: "main"`, `view: "us"`. Alaska and Hawaii are `role: "inset"` with `region: "AK"` and `region: "HI"`. A frame with `view: "world"` is stored for later and is not drawn.

`selectFrame` matches `country`, and matches `region` only when the frame has one. A region frame beats the country frame. The point then has to fall inside that frame's extent. A miss stays in the city list and gets no bead.

A town with fewer than 2 published check-ins shares the nearest metro bead **in that same frame**. If the frame has no metro, the town keeps its own bead. It does not jump to a metro on another frame.

Adding a country later means a new frame (outline, extent, projection) and centroids. The selector and the template already loop frames.

## Outline source

Natural Earth 1:110m Admin 1 – States, Provinces (lakes), release **v5.1.2**, public domain (`naturalearthdata.com/about/terms-of-use`). Same pinned file as the contiguous map:

`https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_110m_admin_1_states_provinces_lakes.geojson`

sha256 `8e048ee20587e124e74de5c6bfeea8132ab2313a8f7f4f97e043617f8f37f7f6`

The script checks that hash and writes integer SVG paths. The site build never downloads it. Alaska and Hawaii were in this file; the original script skipped them. There is no extra simplification. This release's Alaska stays west of about 130°W, so the inset does not wrap the antimeridian.

Fits, both Albers, from `map-projection.js`:

| Frame | Parallels | Origin | Box |
| --- | --- | --- | --- |
| Contiguous US | 29.5°N, 45.5°N | 37.5°N, 96°W | 960×609, unchanged |
| Alaska | 55°N, 65°N | 64°N, 154°W | fitted with 10px padding |
| Hawaii | 18°N, 22°N | 20.5°N, 157.5°W | fitted with 8px padding |

---

## Phase 1 — Alaska and Hawaii insets

**Build**

- Regenerate the outline so the contiguous paths, extent, and projection stay byte-for-byte, and add `ak` and `hi` frames.
- Draw each inset as its own SVG, with the same land, slab, and bead classes as the main map. The box uses `--bg`, `--muted`, and `--text`. No new colours.
- On a wide map (container at least 58rem, which is this map at its 60rem cap), place the insets in the lower-left, over the empty corner left of Texas and below Arizona. The main SVG's viewBox stays 960×609.
- Below that, put the insets in a row under the map. At 390px the corner is too small for a labelled shape and a 44px target. The lower 48 SVG is the same either way.
- City labels and the screen-reader name stay on the existing links. Inset beads put the visible name above the bead (`data-anchor="above"`). The inset's own name (Alaska, Hawaii) is text in the box. The SVG stays `aria-hidden`.
- Hawaii is drawn even when it has no check-ins, so the pair is there before the first Hawaii visit.

**Verify first**

The outline script checks the pinned sha256 before it parses. No other endpoint.

**Gotchas**

- Do not regenerate the contiguous frame with different padding, width, or parallels. Minneapolis stays at SVG 533, 161 and San Francisco at 33, 260.
- Inset paths have to stay in the positive viewBox. The test rejects a minus or a decimal in a path.
- A one-check-in town still shares a metro bead. Anchorage and Girdwood share one bead until Girdwood has a second check-in. That bead is in the Alaska inset, and Girdwood's own centroid projects inside it too.
- Filter ids (`checkins-map-slab`, `checkins-map-lift`, `checkins-map-bead`) live on the main SVG. Inset shapes reference those same ids.
- `view: "world"` must not render. A Thailand frame in the file is not a bead.
- Home-area exclusions still run before any of this. Do not print `CHECKIN_MAP_EXCLUDE` or `CHECKIN_REBUILD_HOOK_URL`.

**Done when:** Anchorage and Girdwood are on the Alaska inset, Minneapolis and San Francisco are on the main map at the old coordinates, a Hawaii test centroid lands in the Hawaii inset, and a non-US country gets no bead. `npm test`, `npm run build`, and `npm run checkins:images -- --check` pass. The map reads at 390 and 1440 in both themes.

## Phase 2 — World view (not this session)

International check-ins (Thailand, Japan, and the rest) need a view of their own. Pins already choose a frame from `country` and `region`. AK and HI stay on the US view. Any other country goes to the world view. Points stay city-level: a centroid rounded to 0.1°, never a place, a trailhead, or a street.

Two options. Stefan picks one before any of this is built.

### Option A — A clay card per country

Under the US map, one small card per country that has a published check-in. The card is the same clay plate as an inset: that country's outline, and one bead per city (after the town-to-metro rule). A country with several nearby cities can collapse them into one bead labelled like "Chiang Mai · 4". The US map does not change when a new country shows up.

This needs no toggle and works with JavaScript off. The page gets longer as countries accumulate. Each country still needs an outline frame plus centroids. The distance that counts as "nearby" has to be chosen once and shared by every country.

### Option B — A US / World toggle

One map is visible. The US side is the Phase 1 composition. The World side is a single small-scale clay map (Natural Earth 1:110m countries, same public-domain pipeline and sha256 check), with city beads. Nearby cities cluster into one bead and a count, same "Chiang Mai · 4" label.

The toggle opens on the view that holds the most recent published check-in. A US check-in, including Alaska and Hawaii, opens the US view. Any other country opens the World view. Build time decides the default, from `country` and `region`, so the first paint is right with no script. Both views stay in the HTML. A radio or a link pair switches them without JavaScript. Do not hide the other view from the city list; the list under the map stays the text alternative either way.

### Shared rules for whichever option

- Adding a country is an outline frame and centroids, not a new template.
- Cluster at city level only. The bead's accessible name lists the cities, the way "Near Anchorage" already lists a town.
- No coordinates in the HTML. No geocoding. Exclusions still apply.
- The outline source is Natural Earth, pinned and hashed, same as Phase 1. Do not fetch it during the site build.

**Done when:** Stefan has picked A or B, a non-US check-in shows on that view, a US check-in stays on the US map, and the city list still works with the map's JavaScript off. Not started.
