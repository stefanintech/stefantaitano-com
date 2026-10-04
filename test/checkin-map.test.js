// Fixture tests for the check-ins city list. Every place name here is made up
// (region and country `ZZ`), and none of them stands for a real exclusion.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {describe, it} from 'node:test';
import Eleventy from '@11ty/eleventy';
import {createCheckinsCollection} from '../src/_config/collections.js';
import {drafts} from '../src/_config/plugins/drafts.js';
import {
  buildCheckinCities,
  buildCheckinMap,
  indexCentroids,
  isExcluded,
  loadExclusions,
  normalizeName,
  parseExclusions
} from '../src/_config/utils/checkin-map.js';
import {projector} from '../src/_config/utils/map-projection.js';

const FIXTURE = './test/fixtures/checkin-map';

const CENTROIDS = {
  'Fakeburg|ZZ|ZZ': {lat: 12.3, lon: 45.6, tier: 'town'},
  'Draftville|ZZ|ZZ': {lat: 23.4, lon: 56.7, tier: 'town'},
  'Futureville|ZZ|ZZ': {lat: 34.5, lon: 67.8, tier: 'metro'}
};

const EXCLUDE = 'Testville|ZZ|ZZ; Saint Testville|ZZ|ZZ; Fakeburg|ZZ|ZZ|EXAMPLE  school.';

// Covers the fixture centroids. Not a real place, and not the site outline.
const OUTLINE = {
  country: 'ZZ',
  width: 400,
  height: 200,
  extent: {west: 0, east: 90, south: 0, north: 80},
  projection: {type: 'albers', parallels: [29.5, 45.5], origin: [-96, 37.5], scale: 200, translate: [200, 100]},
  states: [{postal: 'ZZ', name: 'Zedland', d: 'M0 0L10 0L10 10Z'}]
};

const quietLog = {warn: () => {}};

const build = async ({centroids = CENTROIDS, exclude = EXCLUDE} = {}) => {
  const exclusions = parseExclusions(exclude);
  const elev = new Eleventy(FIXTURE, `${FIXTURE}/_site`, {
    quietMode: true,
    configPath: `${FIXTURE}/eleventy.config.js`,
    config: eleventyConfig => {
      eleventyConfig.setIncludesDirectory('../../../src/_includes');
      eleventyConfig.addPlugin(drafts);
      eleventyConfig.addGlobalData('centroids', centroids);
      eleventyConfig.addGlobalData('outline', OUTLINE);
      eleventyConfig.addCollection(
        'fixtureCheckins',
        createCheckinsCollection({dir: `${FIXTURE}/checkins`, imagesDir: `${FIXTURE}/no-images`})
      );
      eleventyConfig.addFilter('checkinCities', (checkins, data) =>
        buildCheckinCities(checkins, {centroids: data, exclusions})
      );
      eleventyConfig.addFilter('checkinMap', (cities, data, outline) => buildCheckinMap(cities, {centroids: data, outline}));
    }
  });
  // Keeps the expected failures out of the build log, where they'd look real.
  elev.disableLogger();
  elev.errorHandler.logger = elev.logger;
  const pages = await elev.toJSON();
  const page = url => pages.find(entry => entry.url === url)?.content ?? '';
  return {cities: page('/cities/'), collection: page('/collection/'), map: page('/map/')};
};

// Eleventy wraps errors thrown from filters, so collect the whole cause chain.
const errorText = error => {
  const messages = [];
  for (let current = error; current; current = current.originalError ?? current.cause) {
    messages.push(String(current.message ?? current));
  }
  return messages.join('\n');
};

const item = (fileSlug, data) => ({
  fileSlug,
  inputPath: `./fixture/${fileSlug}.md`,
  data: {publishAfter: '2025-01-02T12:00:00-05:00', country: 'ZZ', region: 'ZZ', precision: 'city', ...data}
});

describe('fixture build (collection → exclusions → city list)', () => {
  it('lists published, non-excluded cities with counts and anchors', async () => {
    const {cities} = await build();
    assert.match(cities, /<h3 class="checkins-city__name">Fakeburg, ZZ<\/h3>/);
    assert.match(cities, /id="city-fakeburg-zz-zz"/);
    assert.match(cities, /2 check-ins/);
    assert.match(cities, /<a href="#checkin-[0-9a-f]{10}">Example Pier<\/a>/);
    assert.match(cities, /<a href="#checkin-[0-9a-f]{10}">Trail<\/a>/);
  });

  it('drops drafts and future publishAfter entries from the collection itself', async () => {
    const {collection, cities} = await build();
    assert.doesNotMatch(collection, /draftville|futureville/);
    assert.doesNotMatch(cities, /Draftville|Futureville/);
  });

  it('drops excluded cities, alias spellings, and excluded places', async () => {
    const {collection, cities} = await build();
    assert.match(collection, /st-testville/);
    assert.doesNotMatch(cities, /testville/i);
    assert.doesNotMatch(cities, /Example School/i);
  });

  it('puts no coordinates, dates, or "latest" in the HTML', async () => {
    const {cities} = await build();
    for (const {lat, lon} of Object.values(CENTROIDS)) {
      assert.ok(!cities.includes(String(lat)) && !cities.includes(String(lon)));
    }
    assert.doesNotMatch(cities, /\b(lat|lon|latitude|longitude)\b/i);
    assert.doesNotMatch(cities, /<time|datetime|\b(19|20)\d{2}\b/);
    assert.doesNotMatch(cities, /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/);
    assert.doesNotMatch(cities, /latest|last seen/i);
  });

  it('draws the map as links to the city list, with no coordinates or dates', async () => {
    const {map} = await build();
    assert.match(map, /aria-label="Map of cities with check-ins"/);
    assert.match(map, /href="#city-fakeburg-zz-zz"/);
    assert.match(map, /aria-label="Fakeburg, ZZ: 2 check-ins"/);
    assert.match(map, /<path class="checkins-map__state" d="M0 0L10 0L10 10Z"/);
    assert.doesNotMatch(map, /Near /);
    assert.doesNotMatch(map, /Draftville|Futureville|Testville|Example School/i);
    for (const {lat, lon} of Object.values(CENTROIDS)) {
      assert.ok(!map.includes(String(lat)) && !map.includes(String(lon)));
    }
    assert.doesNotMatch(map, /\b(lat|lon|latitude|longitude)\b/i);
    assert.doesNotMatch(map, /<time|datetime|\b(19|20)\d{2}\b/);
  });

  it('fails the build on a missing centroid', async () => {
    const {['Fakeburg|ZZ|ZZ']: _removed, ...rest} = CENTROIDS;
    await assert.rejects(build({centroids: rest}), error => {
      assert.match(errorText(error), /no centroid for "Fakeburg\|ZZ\|ZZ"/);
      return true;
    });
  });

  it('fails the build when a centroid belongs to an excluded city, without naming it', async () => {
    const centroids = {...CENTROIDS, 'Testville|ZZ|ZZ': {lat: 1.1, lon: 2.2, tier: 'town'}};
    await assert.rejects(build({centroids}), error => {
      const text = errorText(error);
      assert.match(text, /matches CHECKIN_MAP_EXCLUDE/);
      assert.doesNotMatch(text, /testville/i);
      return true;
    });
  });
});

describe('normalization', () => {
  it('treats St./Saint, case, and punctuation the same', () => {
    const forms = ['St. Testville', 'Saint Testville', 'ST TESTVILLE', 'saint-testville', 'St.Testville', ' St  Testville. '];
    for (const form of forms) assert.equal(normalizeName(form), 'saint testville');
  });

  it('matches full state names, country aliases, and blank regions', () => {
    const rules = parseExclusions('Testville|VT|US');
    assert.ok(isExcluded({city: 'Testville', region: 'Vermont', country: 'USA'}, rules));
    assert.ok(isExcluded({city: 'testville', country: 'US'}, rules));
    assert.ok(!isExcluded({city: 'Testville', region: 'NH', country: 'US'}, rules));
  });

  it('lets a city-only key cover any region and a place of the same name', () => {
    const rules = parseExclusions('Fakeburg');
    assert.ok(isExcluded({city: 'Fakeburg', region: 'ZZ', country: 'ZZ'}, rules));
    assert.ok(isExcluded({city: 'Elsewhere', place: 'Fakeburg', region: 'ZZ', country: 'ZZ'}, rules));
  });

  it('accepts newlines and wildcards, and rejects malformed entries', () => {
    const rules = parseExclusions('Testville|ZZ|ZZ\n*|*|*|Example School');
    assert.equal(rules.length, 2);
    assert.ok(isExcluded({city: 'Anywhere', place: 'example school', region: 'ZZ', country: 'ZZ'}, rules));
    assert.throws(() => parseExclusions('a|b|c|d|e'), /entry 1 has more than four fields/);
    assert.throws(() => parseExclusions('Testville; *|*|*'), /entry 2 would match every check-in/);
  });
});

describe('CHECKIN_MAP_EXCLUDE loading', () => {
  it('fails production builds when the var is missing or blank', () => {
    assert.throws(() => loadExclusions({CONTEXT: 'production'}, quietLog), /CHECKIN_MAP_EXCLUDE is not set/);
    assert.throws(() => loadExclusions({CONTEXT: 'production', CHECKIN_MAP_EXCLUDE: '  '}, quietLog));
  });

  it('warns and leaves the list out in previews and local builds', () => {
    const warnings = [];
    const log = {warn: message => warnings.push(message)};
    assert.equal(loadExclusions({CONTEXT: 'deploy-preview'}, log), null);
    assert.equal(loadExclusions({}, log), null);
    assert.equal(warnings.length, 2);
    assert.deepEqual(buildCheckinCities([item('2025-01-01-fakeburg', {city: 'Fakeburg'})], {centroids: CENTROIDS, exclusions: null}), []);
  });

  it('never echoes the value in its messages', () => {
    const warnings = [];
    loadExclusions({CONTEXT: 'branch-deploy'}, {warn: message => warnings.push(message)});
    const rules = loadExclusions({CONTEXT: 'production', CHECKIN_MAP_EXCLUDE: 'Testville|ZZ|ZZ'}, quietLog);
    assert.equal(rules.length, 1);
    assert.doesNotMatch(warnings.join(' '), /testville/i);
  });
});

describe('centroid lookup', () => {
  const exclusions = parseExclusions('Testville|ZZ|ZZ');

  it('fails on an ambiguous city with no region', () => {
    const centroids = {'Fakeburg|ZZ|ZZ': {lat: 1.1, lon: 1.1, tier: 'town'}, 'Fakeburg|YY|ZZ': {lat: 2.2, lon: 2.2, tier: 'town'}};
    const items = [item('2025-01-01-fakeburg', {city: 'Fakeburg', region: undefined})];
    assert.throws(() => buildCheckinCities(items, {centroids, exclusions}), /ambiguous centroid/);
  });

  it('fails on two keys for the same city', () => {
    const centroids = {'St. Fakeburg|ZZ|ZZ': {lat: 1.1, lon: 1.1, tier: 'town'}, 'Saint Fakeburg|ZZ|ZZ': {lat: 1.1, lon: 1.1, tier: 'town'}};
    assert.throws(() => indexCentroids(centroids), /same city \(ambiguous\)/);
  });

  it('rejects unrounded coordinates, unknown tiers, and extra keys', () => {
    assert.throws(() => indexCentroids({'Fakeburg|ZZ|ZZ': {lat: 12.34, lon: 1.1, tier: 'town'}}), /lat must be a number rounded to 0.1/);
    assert.throws(() => indexCentroids({'Fakeburg|ZZ|ZZ': {lat: 1.1, lon: 1.1, tier: 'village'}}), /tier must be metro or town/);
    assert.throws(() => indexCentroids({'Fakeburg|ZZ|ZZ': {lat: 1.1, lon: 1.1, tier: 'town', name: 'x'}}), /unknown key "name"/);
  });

  it('resolves spelling variants to one city and drops drafts and future entries on its own', () => {
    const centroids = {'Saint Fakeburg|ZZ|ZZ': {lat: 1.1, lon: 1.1, tier: 'town'}};
    const items = [
      item('2025-01-01-a', {city: 'St. Fakeburg'}),
      item('2025-01-02-b', {city: 'SAINT FAKEBURG'}),
      item('2025-01-03-c', {city: 'St. Fakeburg', draft: true}),
      item('2099-01-01-d', {city: 'St. Fakeburg', publishAfter: '2099-01-02T12:00:00-05:00'})
    ];
    const [city, ...others] = buildCheckinCities(items, {centroids, exclusions});
    assert.equal(others.length, 0);
    assert.equal(city.count, 2);
    assert.equal(city.label, 'Saint Fakeburg, ZZ');
    assert.ok(!('lat' in city) && !('lon' in city));
  });

  it('keeps src/_data/cityCentroids.json valid', () => {
    const centroids = JSON.parse(fs.readFileSync('./src/_data/cityCentroids.json', 'utf8'));
    assert.ok(indexCentroids(centroids).size > 0);
  });
});

describe('clay map', () => {
  const exclusions = parseExclusions('Nopeville|ZZ|ZZ');
  const centroids = {
    'Metroburg|ZZ|ZZ': {lat: 40.0, lon: 10.0, tier: 'metro'},
    'Otherburg|ZZ|ZZ': {lat: 48.0, lon: 30.0, tier: 'metro'},
    'Tinyton|ZZ|ZZ': {lat: 40.4, lon: 10.2, tier: 'town'},
    'Twinburg|ZZ|ZZ': {lat: 42.0, lon: 12.0, tier: 'town'},
    'Farville|ZZ|ZZ': {lat: 10.0, lon: 10.0, tier: 'metro'}
  };
  const outline = {
    country: 'ZZ',
    width: 960,
    height: 600,
    extent: {west: 0, east: 40, south: 30, north: 50},
    projection: OUTLINE.projection,
    states: OUTLINE.states
  };
  const citiesFor = () =>
    buildCheckinCities(
      [
        item('metro', {city: 'Metroburg', kind: 'cafe'}),
        item('tiny', {city: 'Tinyton', kind: 'park'}),
        item('twin-a', {city: 'Twinburg', kind: 'trail'}),
        item('twin-b', {city: 'Twinburg', kind: 'cafe'}),
        item('far', {city: 'Farville', kind: 'park'}),
        item('nope', {city: 'Nopeville', kind: 'park'})
      ],
      {centroids, exclusions}
    );

  it('snaps a single-check-in town onto the nearest metro and leaves the town named in the list', () => {
    const cities = citiesFor();
    assert.ok(cities.some(city => city.label === 'Tinyton, ZZ'));
    assert.ok(!cities.some(city => city.label.startsWith('Nopeville')));

    const map = buildCheckinMap(cities, {centroids, outline});
    const near = map.spots.find(spot => spot.href === '#city-metroburg-zz-zz');
    const twin = map.spots.find(spot => spot.label.startsWith('Twinburg'));
    assert.equal(near.label, 'Near Metroburg, ZZ: 2 check-ins in Metroburg, ZZ and Tinyton, ZZ');
    assert.equal(near.name, 'near Metroburg');
    assert.equal(near.count, 2);
    assert.equal(twin.label, 'Twinburg, ZZ: 2 check-ins');
    assert.ok(!map.spots.some(spot => /Farville|Nopeville|Tinyton/.test(spot.href)));
    assert.ok(map.spots.every(spot => !('lat' in spot) && !('lon' in spot) && Number.isInteger(spot.x) && Number.isInteger(spot.y)));
    assert.ok(map.spots.every(spot => spot.target >= 22));
  });

  it('draws nothing when no city falls inside the outline', () => {
    const cities = buildCheckinCities([item('far', {city: 'Farville'})], {centroids, exclusions});
    assert.equal(cities.length, 1);
    assert.equal(buildCheckinMap(cities, {centroids, outline}), null);
  });

  it('projects the published cities onto the committed outline', () => {
    const liveCentroids = JSON.parse(fs.readFileSync('./src/_data/cityCentroids.json', 'utf8'));
    const liveOutline = JSON.parse(fs.readFileSync('./src/_data/checkinMapOutline.json', 'utf8'));
    assert.equal(liveOutline.source.sha256, '8e048ee20587e124e74de5c6bfeea8132ab2313a8f7f4f97e043617f8f37f7f6');
    assert.equal(liveOutline.states.length, 49);
    assert.ok(liveOutline.states.every(state => state.postal !== 'AK' && state.postal !== 'HI' && !/[.-]\d/.test(state.d)));

    const project = projector(liveOutline.projection);
    const cities = Object.keys(liveCentroids).map(key => ({
      key,
      slug: 'city-example',
      label: key.split('|')[0],
      count: 1,
      checkins: []
    }));
    const map = buildCheckinMap(cities, {centroids: liveCentroids, outline: liveOutline});
    assert.equal(map.spots.length, cities.length);
    for (const [key, centroid] of Object.entries(liveCentroids)) {
      const [x, y] = project(centroid.lon, centroid.lat);
      const spot = map.spots.find(entry => entry.label.startsWith(key.split('|')[0]));
      assert.equal(spot.x, x);
      assert.equal(spot.y, y);
      assert.ok(x > 0 && x < liveOutline.width && y > 0 && y < liveOutline.height);
      assert.ok(!('lat' in spot) && !('lon' in spot));
      assert.ok(!JSON.stringify(spot).includes(centroid.lat.toFixed(1)));
      assert.ok(!JSON.stringify(spot).includes(centroid.lon.toFixed(1)));
    }
  });
});

describe('map theme and polish', () => {
  const css = fs.readFileSync('./src/assets/css/local/checkin-map.css', 'utf8');
  const colors = Object.fromEntries(
    JSON.parse(fs.readFileSync('./src/_data/designTokens/colors.json', 'utf8')).items.map(item => [item.name, item.value])
  );
  const lin = channel => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance = hex => {
    const number = parseInt(hex.slice(1), 16);
    return 0.2126 * lin(number >> 16) + 0.7152 * lin((number >> 8) & 255) + 0.0722 * lin(number & 255);
  };
  const contrast = (a, b) => {
    const [lighter, darker] = [luminance(a), luminance(b)].sort((left, right) => right - left);
    return (lighter + 0.05) / (darker + 0.05);
  };

  it('keeps label text and bead rims at WCAG AA in both themes', () => {
    // Labels use --color-text on --color-bg. Beads use amber on the light land
    // and gold on the dark land, which are the rims declared in checkin-map.css.
    assert.ok(contrast(colors['Gray 800'], colors['Gray 100']) >= 4.5);
    assert.ok(contrast(colors['Gray 100'], colors['Gray 800']) >= 4.5);
    assert.ok(contrast(colors['Amber'], colors['Gray 200']) >= 3);
    assert.ok(contrast(colors['Gold Subdued'], colors['Gray 700']) >= 3);
    assert.match(css, /--map-bead-edge: var\(--color-primary\)/);
    assert.match(css, /--map-bead-edge: var\(--color-tertiary\)/);
    assert.match(css, /--map-label: var\(--color-text\)/);
    assert.match(css, /--map-label-bg: var\(--color-bg\)/);
  });

  it('follows the theme, shows focus, stays 44px, and adds no motion unless asked', () => {
    assert.match(css, /prefers-color-scheme: dark/);
    assert.match(css, /data-theme='dark'/);
    assert.match(css, /data-theme='light'/);
    assert.match(css, /focus-visible/);
    assert.match(css, /max\(2\.75rem, 44px\)/);
    assert.match(css, /prefers-reduced-motion: no-preference/);
    assert.doesNotMatch(css, /@keyframes|animation:/);
  });
});
