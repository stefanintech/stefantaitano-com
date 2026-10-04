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
  indexCentroids,
  isExcluded,
  loadExclusions,
  normalizeName,
  parseExclusions
} from '../src/_config/utils/checkin-map.js';

const FIXTURE = './test/fixtures/checkin-map';

const CENTROIDS = {
  'Fakeburg|ZZ|ZZ': {lat: 12.3, lon: 45.6, tier: 'town'},
  'Draftville|ZZ|ZZ': {lat: 23.4, lon: 56.7, tier: 'town'},
  'Futureville|ZZ|ZZ': {lat: 34.5, lon: 67.8, tier: 'metro'}
};

const EXCLUDE = 'Testville|ZZ|ZZ; Saint Testville|ZZ|ZZ; Fakeburg|ZZ|ZZ|EXAMPLE  school.';

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
      eleventyConfig.addCollection(
        'fixtureCheckins',
        createCheckinsCollection({dir: `${FIXTURE}/checkins`, imagesDir: `${FIXTURE}/no-images`})
      );
      eleventyConfig.addFilter('checkinCities', (checkins, data) =>
        buildCheckinCities(checkins, {centroids: data, exclusions})
      );
    }
  });
  // Keeps the expected failures out of the build log, where they'd look real.
  elev.disableLogger();
  elev.errorHandler.logger = elev.logger;
  const pages = await elev.toJSON();
  const page = url => pages.find(entry => entry.url === url)?.content ?? '';
  return {cities: page('/cities/'), collection: page('/collection/')};
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
