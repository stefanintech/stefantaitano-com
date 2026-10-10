// Fixture tests for the /next/ home stream. Every place name here is made up
// (region and country `ZZ`).
import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import Eleventy from '@11ty/eleventy';
import {buildHomeStream, createCheckinsCollection, createHomeStreamCollection} from '../src/_config/collections.js';
import {formatDateUtc} from '../src/_config/filters/dates.js';
import {drafts} from '../src/_config/plugins/drafts.js';
import {checkinAnchor} from '../src/_config/utils/checkin-map.js';

const FIXTURE = './test/fixtures/home-stream';

const render = async ({limit, url = '/stream/'} = {}) => {
  const elev = new Eleventy(FIXTURE, `${FIXTURE}/_site`, {
    quietMode: true,
    configPath: `${FIXTURE}/eleventy.config.js`,
    config: eleventyConfig => {
      eleventyConfig.setIncludesDirectory('../../../src/_includes');
      eleventyConfig.addPlugin(drafts);
      eleventyConfig.addFilter('formatDateUtc', formatDateUtc);
      eleventyConfig.addFilter('checkinAnchor', checkinAnchor);
      eleventyConfig.addCollection(
        'fixtureStream',
        createHomeStreamCollection({
          posts: collection => collection.getFilteredByGlob(`${FIXTURE}/posts/*.md`).reverse(),
          nowEntries: collection => collection.getFilteredByGlob(`${FIXTURE}/now-entries/*.md`).reverse(),
          checkins: createCheckinsCollection({dir: `${FIXTURE}/checkins`, imagesDir: `${FIXTURE}/no-images`}),
          limit
        })
      );
      eleventyConfig.addCollection(
        'fixtureCheckins',
        createCheckinsCollection({dir: `${FIXTURE}/checkins`, imagesDir: `${FIXTURE}/no-images`})
      );
    }
  });
  elev.disableLogger();
  const pages = await elev.toJSON();
  return pages.find(entry => entry.url === url)?.content ?? '';
};

const build = options => render(options);
const buildTiles = () => render({url: '/tiles/'});
const tiles = html => html.match(/<li class="rasa-tile[\s\S]*?<\/li>/g) ?? [];
const tileLabel = tile => tile.match(/rasa-tile__label"><a href="([^"]+)">([^<]*)<\/a>/);

const cards = html => html.match(/<article class="rasa-card[\s\S]*?<\/article>/g) ?? [];

describe('home stream fixture build', () => {
  it('mixes posts, check-ins, and /now newest first by calendar day', async () => {
    const html = await build();
    const order = cards(html).map(card => card.match(/<time datetime="([^"]+)"/)[1]);
    assert.deepEqual(order, ['2025-05-04', '2025-05-04', '2025-05-03', '2025-05-02', '2025-05-01']);
    const types = cards(html).map(card => card.match(/rasa-card__type">([^<]+)</)[1]);
    assert.deepEqual(types.sort(), ['Checked in', 'Checked in', 'Now', 'Post', 'Post']);
  });

  it('leaves out drafts and check-ins whose publishAfter has not passed', async () => {
    const html = await build();
    for (const hidden of ['Draftville', 'Hidden Draft Cafe', 'Futureville', 'Future Overlook', '2099']) {
      assert.ok(!html.includes(hidden), `${hidden} reached the stream`);
    }
  });

  it('puts no coordinates in the HTML', async () => {
    const html = await build();
    assert.doesNotMatch(html, /\b(lat|lon|lng|latitude|longitude|coords?)\b/i);
    assert.doesNotMatch(html, /-?\d{1,3}\.\d{2,}/, 'found a coordinate-looking number');
  });

  it('labels a city-only check-in with the city alone', async () => {
    const card = cards(await build()).find(entry => entry.includes('Short walk'));
    const label = card.match(/rasa-card__label">\s*<a href="([^"]+)">([^<]*)<\/a>/);
    assert.equal(label[2], 'Fakeburg');
    assert.match(label[1], /^\/checkins\/#checkin-[0-9a-f]{10}$/);
    assert.ok(!card.includes('ZZ'), 'city-only card shows a region or country');
    assert.ok(!card.includes('Park'), 'city-only card shows the kind as a place');
  });

  it('labels a place check-in with the place, the city, and its note', async () => {
    const card = cards(await build()).find(entry => entry.includes('Example Pier'));
    const label = card.match(/rasa-card__label">\s*<a href="[^"]+">([^<]*)<\/a>/)[1].replaceAll('&nbsp;', '\u00a0');
    assert.equal(label, 'Example Pier\u00a0· Fakeburg');
    assert.match(card, /Windy at the end of the pier\./);
    assert.ok(!card.includes('ZZ'), 'place card shows a region or country');
    assert.doesNotMatch(card, /\b(lat|lon|lng|latitude|longitude|coords?)\b/i);
    assert.doesNotMatch(card, /-?\d{1,3}\.\d{2,}/);
  });

  it('links /now entries to their id on /now/', async () => {
    assert.match(await build(), /href="\/now\/#now-2025-05-04"/);
  });

  it('caps the list and links the archives', async () => {
    const html = await build({limit: 2});
    assert.equal(cards(html).length, 2);
    assert.match(html, /href="\/articles\/"[\s\S]*href="\/checkins\/"[\s\S]*href="\/now\/"/);
    assert.ok(!(await build()).includes('rasa-stream__more'), 'archive links show without a cap');
  });
});

describe('/checkins/ tile grid fixture build', () => {
  it('shows every published check-in newest first, and no future or draft one', async () => {
    const html = await buildTiles();
    const days = tiles(html).map(tile => tile.match(/<time datetime="([^"]+)"/)[1]);
    assert.deepEqual(days, ['2025-05-04', '2025-05-02']);
    for (const hidden of ['Draftville', 'Hidden Draft Cafe', 'Futureville', 'Future Overlook', '2099']) {
      assert.ok(!html.includes(hidden), `${hidden} reached the grid`);
    }
  });

  it('labels a city-only tile with the city and no place name', async () => {
    const tile = tiles(await buildTiles()).find(entry => entry.includes('Short walk'));
    const [, href, text] = tileLabel(tile);
    assert.equal(text, 'Fakeburg');
    assert.ok(!tile.includes('·'), 'city-only tile has a place separator');
    assert.ok(!tile.includes('ZZ'), 'city-only tile shows a region or country');
    assert.ok(!tile.includes('Park'), 'city-only tile shows the kind as a place');
    assert.match(tile, new RegExp(`id="${href.slice(1)}"`));
  });

  it('labels a place tile with the place and the city', async () => {
    const tile = tiles(await buildTiles()).find(entry => entry.includes('Example Pier'));
    assert.equal(tileLabel(tile)[2].replaceAll('&nbsp;', '\u00a0'), 'Example Pier\u00a0· Fakeburg');
    assert.match(tile, /Windy at the end of the pier\./);
    assert.ok(!tile.includes('ZZ'), 'place tile shows a region or country');
  });

  it('keeps the checkin-<hash> ids and makes a text tile when there is no image', async () => {
    for (const tile of tiles(await buildTiles())) {
      assert.match(tile, /^<li class="rasa-tile rasa-tile--text" id="checkin-[0-9a-f]{10}">/);
      assert.ok(!tile.includes('<img'), 'text tile invented a picture');
    }
  });

  it('puts no coordinates in the grid', async () => {
    const html = await buildTiles();
    assert.doesNotMatch(html, /\b(lat|lon|lng|latitude|longitude|coords?)\b/i);
    assert.doesNotMatch(html, /-?\d{1,3}\.\d{2,}/, 'found a coordinate-looking number');
  });
});

describe('buildHomeStream', () => {
  it('sorts by UTC day and keeps 30 by default', () => {
    const posts = Array.from({length: 40}, (_, i) => ({date: new Date(Date.UTC(2025, 0, 1 + i))}));
    const {items, capped} = buildHomeStream({posts});
    assert.equal(items.length, 30);
    assert.ok(capped);
    assert.equal(items[0].day, '2025-02-09');
  });
});
