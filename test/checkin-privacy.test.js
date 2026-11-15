// Planted check-in data, not site files. The smoke test runs the output scan on dist/.
import assert from 'node:assert/strict';
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {describe, it} from 'node:test';
import {fileURLToPath} from 'node:url';
import {checkinAnchor} from '../src/_config/utils/checkin-map.js';
import {
  checkinDataCoordinateProblems,
  coordinateKeyProblems,
  futureCheckinLeaks,
  readCheckinEntries
} from './checks/checkin-privacy.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NOW = Date.parse('2026-11-15T00:00:00Z');

describe('check-in coordinate fields', () => {
  it('fails a planted data file that has coordinate keys', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'checkin-privacy-'));
    try {
      writeFileSync(
        path.join(dir, 'planted.json'),
        JSON.stringify({place: 'Planted Pier', coordinates: {lat: 1, lng: 2}})
      );
      writeFileSync(path.join(dir, 'planted.yaml'), 'place: Planted Pier\nlatitude: "1.0"\n');
      assert.deepEqual(checkinDataCoordinateProblems(dir), [
        'planted.json: coordinates',
        'planted.json: coordinates.lat',
        'planted.json: coordinates.lng',
        'planted.yaml: latitude'
      ]);
    } finally {
      rmSync(dir, {recursive: true, force: true});
    }
  });

  it('ignores ordinary check-in fields', () => {
    assert.deepEqual(coordinateKeyProblems({place: 'Planted Pier', city: 'Futureville', permalink: false}, 'fixture'), []);
  });

  it('finds no coordinate keys in src/checkins data files', () => {
    assert.deepEqual(checkinDataCoordinateProblems(path.join(ROOT, 'src/checkins')), []);
  });
});

describe('future check-ins in build output', () => {
  const entries = () => readCheckinEntries(path.join(ROOT, 'test/fixtures/home-stream/checkins'));

  it('reads the planted future fixture', () => {
    const future = entries().find(entry => entry.slug === '2099-01-01-futureville');
    assert.ok(future);
    assert.equal(future.place, 'Future Overlook');
    assert.equal(future.publishAfter, '2099-01-02T12:00:00-05:00');
  });

  it('fails when a planted future check-in shows up in the HTML', () => {
    const future = entries().find(entry => entry.slug === '2099-01-01-futureville');
    const anchor = checkinAnchor({fileSlug: future.slug});
    const html = `<article id="${anchor}"><h2>${future.place}</h2><p>${future.slug}</p><p>${future.publishAfter}</p></article>`;
    const leaks = futureCheckinLeaks({
      entries: entries(),
      files: [{file: '/planted/', text: html}],
      now: NOW
    });

    assert.deepEqual(
      leaks.filter(leak => leak.slug === '2099-01-01-futureville').map(leak => leak.marker),
      [future.publishAfter, future.slug, anchor, future.place]
    );
    assert.ok(leaks.every(leak => leak.file === '/planted/'));
    assert.equal(leaks.some(leak => leak.slug === '2025-05-02-example-pier'), false);
  });

  it('passes when the planted future check-in is absent from the HTML', () => {
    const html = '<article><h2>Example Pier</h2><p>Windy at the end of the pier.</p></article>';
    assert.deepEqual(
      futureCheckinLeaks({entries: entries(), files: [{file: '/planted/', text: html}], now: NOW}),
      []
    );
  });

  it('ignores a check-in once publishAfter has passed', () => {
    const future = entries().find(entry => entry.slug === '2099-01-01-futureville');
    const html = `<p>${future.place}</p>`;
    const after = Date.parse('2099-01-03T00:00:00Z');
    assert.deepEqual(
      futureCheckinLeaks({entries: [future], files: [{file: '/planted/', text: html}], now: after}),
      []
    );
  });
});
