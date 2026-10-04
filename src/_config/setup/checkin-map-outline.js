/**
 * Builds the check-ins map outline from Natural Earth's 1:110m US states.
 *
 *   npm run checkins:map-outline                 # downloads the pinned release
 *   npm run checkins:map-outline -- <file.geojson>
 *
 * Writes src/_data/checkinMapOutline.json: the projection the build uses for
 * city beads, plus one whole-number SVG path per contiguous state. Run by hand
 * and commit the result; the site build never fetches anything.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import {albers} from '../utils/map-projection.js';

const SOURCE = {
  name: 'Natural Earth 1:110m Admin 1 – States, Provinces (lakes)',
  version: 'v5.1.2',
  url: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_110m_admin_1_states_provinces_lakes.geojson',
  sha256: '8e048ee20587e124e74de5c6bfeea8132ab2313a8f7f4f97e043617f8f37f7f6',
  license: 'Public domain (naturalearthdata.com/about/terms-of-use)'
};
const OUT = './src/_data/checkinMapOutline.json';
const SKIP = new Set(['AK', 'HI']);
const PARALLELS = [29.5, 45.5];
const ORIGIN = [-96, 37.5];
const WIDTH = 960;
const PADDING = 16;
const EXTENT_MARGIN = 0.5;

const readSource = async file => {
  const bytes = file ? fs.readFileSync(file) : Buffer.from(await (await fetch(SOURCE.url)).arrayBuffer());
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  if (sha256 !== SOURCE.sha256) {
    throw new Error(`[checkins:map-outline] sha256 ${sha256} does not match the pinned ${SOURCE.version} file`);
  }
  return JSON.parse(bytes.toString('utf8'));
};

const polygonsOf = geometry =>
  geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.type === 'MultiPolygon' ? geometry.coordinates : [];

const main = async () => {
  const geojson = await readSource(process.argv[2]);
  const states = geojson.features
    .filter(feature => feature.properties.adm0_a3 === 'USA' && !SKIP.has(feature.properties.postal))
    .map(feature => ({postal: feature.properties.postal, name: feature.properties.name, polygons: polygonsOf(feature.geometry)}))
    .sort((a, b) => a.postal.localeCompare(b.postal));

  const raw = albers({parallels: PARALLELS, origin: ORIGIN});
  const extent = {west: Infinity, east: -Infinity, south: Infinity, north: -Infinity};
  const bounds = {minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity};
  for (const state of states) {
    for (const ring of state.polygons.flat()) {
      for (const [lon, lat] of ring) {
        extent.west = Math.min(extent.west, lon);
        extent.east = Math.max(extent.east, lon);
        extent.south = Math.min(extent.south, lat);
        extent.north = Math.max(extent.north, lat);
        const [x, y] = raw(lon, lat);
        bounds.minX = Math.min(bounds.minX, x);
        bounds.maxX = Math.max(bounds.maxX, x);
        bounds.minY = Math.min(bounds.minY, y);
        bounds.maxY = Math.max(bounds.maxY, y);
      }
    }
  }

  const scale = Number(((WIDTH - 2 * PADDING) / (bounds.maxX - bounds.minX)).toFixed(4));
  const translate = [PADDING - bounds.minX * scale, PADDING - bounds.minY * scale].map(value => Number(value.toFixed(2)));
  const height = Math.ceil((bounds.maxY - bounds.minY) * scale + 2 * PADDING);
  const project = (lon, lat) => {
    const [x, y] = raw(lon, lat);
    return [Math.round(x * scale + translate[0]), Math.round(y * scale + translate[1])];
  };

  const ringPath = ring => {
    const points = [];
    for (const [lon, lat] of ring) {
      const point = project(lon, lat);
      const last = points.at(-1);
      if (!last || last[0] !== point[0] || last[1] !== point[1]) points.push(point);
    }
    if (points.length > 1 && points[0][0] === points.at(-1)[0] && points[0][1] === points.at(-1)[1]) points.pop();
    if (points.length < 3) return '';
    return `M${points.map(([x, y]) => `${x} ${y}`).join('L')}Z`;
  };

  const output = {
    source: SOURCE,
    country: 'US',
    note: 'Contiguous US only. Alaska and Hawaii are not drawn yet.',
    width: WIDTH,
    height,
    extent: Object.fromEntries(
      Object.entries(extent).map(([key, value]) => [
        key,
        Number((key === 'west' || key === 'south' ? value - EXTENT_MARGIN : value + EXTENT_MARGIN).toFixed(1))
      ])
    ),
    projection: {type: 'albers', parallels: PARALLELS, origin: ORIGIN, scale, translate},
    states: states
      .map(state => ({postal: state.postal, name: state.name, d: state.polygons.map(polygon => polygon.map(ringPath).join('')).join('')}))
      .filter(state => state.d)
  };

  fs.writeFileSync(OUT, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`[checkins:map-outline] wrote ${OUT}: ${output.states.length} states, ${WIDTH}×${height}`);
};

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
