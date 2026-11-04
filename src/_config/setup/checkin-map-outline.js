/**
 * Builds the check-ins map frames from Natural Earth's 1:110m US states.
 *
 *   npm run checkins:map-outline                 # downloads the pinned release
 *   npm run checkins:map-outline -- <file.geojson>
 *
 * Writes src/_data/checkinMapOutline.json: one frame per drawn region, each
 * with its own extent and Albers fit, plus whole-number SVG paths. The
 * contiguous US frame keeps the original 960-wide fit. Alaska and Hawaii are
 * inset frames in their own boxes. Run by hand and commit the result; the
 * site build never fetches anything.
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

const featuresFor = (geojson, {postal, skip}) =>
  geojson.features
    .filter(feature => feature.properties.adm0_a3 === 'USA')
    .filter(feature => (postal ? feature.properties.postal === postal : !skip.has(feature.properties.postal)))
    .map(feature => ({postal: feature.properties.postal, name: feature.properties.name, polygons: polygonsOf(feature.geometry)}))
    .sort((a, b) => a.postal.localeCompare(b.postal));

const boundsOf = (states, raw) => {
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
  return {extent, bounds};
};

const paddedExtent = extent =>
  Object.fromEntries(
    Object.entries(extent).map(([key, value]) => [
      key,
      Number((key === 'west' || key === 'south' ? value - EXTENT_MARGIN : value + EXTENT_MARGIN).toFixed(1))
    ])
  );

const pathsFor = (states, project) => {
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
  return states
    .map(state => ({postal: state.postal, name: state.name, d: state.polygons.map(polygon => polygon.map(ringPath).join('')).join('')}))
    .filter(state => state.d);
};

/**
 * Contiguous US: scale to a fixed width and let the height follow.
 * Same constants as the original outline, so the lower 48 does not move.
 */
const contiguousFrame = states => {
  const parallels = [29.5, 45.5];
  const origin = [-96, 37.5];
  const width = 960;
  const padding = 16;
  const raw = albers({parallels, origin});
  const {extent, bounds} = boundsOf(states, raw);
  const scale = Number(((width - 2 * padding) / (bounds.maxX - bounds.minX)).toFixed(4));
  const translate = [padding - bounds.minX * scale, padding - bounds.minY * scale].map(value => Number(value.toFixed(2)));
  const height = Math.ceil((bounds.maxY - bounds.minY) * scale + 2 * padding);
  const project = (lon, lat) => {
    const [x, y] = raw(lon, lat);
    return [Math.round(x * scale + translate[0]), Math.round(y * scale + translate[1])];
  };
  return {
    id: 'us',
    role: 'main',
    view: 'us',
    country: 'US',
    width,
    height,
    extent: paddedExtent(extent),
    projection: {type: 'albers', parallels, origin, scale, translate},
    states: pathsFor(states, project)
  };
};

/** Inset: one uniform scale that fits the shape inside a box with even padding. */
const insetFrame = (states, {id, label, region, parallels, origin, contentWidth, padding}) => {
  const raw = albers({parallels, origin});
  const {extent, bounds} = boundsOf(states, raw);
  const spanX = bounds.maxX - bounds.minX;
  const spanY = bounds.maxY - bounds.minY;
  const contentHeight = contentWidth / (spanX / spanY);
  const width = Math.round(contentWidth + 2 * padding);
  const height = Math.round(contentHeight + 2 * padding);
  const scale = Number((Math.min((width - 2 * padding) / spanX, (height - 2 * padding) / spanY)).toFixed(4));
  const translate = [
    (width - spanX * scale) / 2 - bounds.minX * scale,
    (height - spanY * scale) / 2 - bounds.minY * scale
  ].map(value => Number(value.toFixed(2)));
  const project = (lon, lat) => {
    const [x, y] = raw(lon, lat);
    return [Math.round(x * scale + translate[0]), Math.round(y * scale + translate[1])];
  };
  return {
    id,
    label,
    role: 'inset',
    view: 'us',
    country: 'US',
    region,
    width,
    height,
    extent: paddedExtent(extent),
    projection: {type: 'albers', parallels, origin, scale, translate},
    states: pathsFor(states, project)
  };
};

const main = async () => {
  const geojson = await readSource(process.argv[2]);
  const contiguous = contiguousFrame(featuresFor(geojson, {skip: new Set(['AK', 'HI'])}));
  const alaska = insetFrame(featuresFor(geojson, {postal: 'AK'}), {
    id: 'ak',
    label: 'Alaska',
    region: 'AK',
    parallels: [55, 65],
    origin: [-154, 64],
    contentWidth: 200,
    padding: 10
  });
  const hawaii = insetFrame(featuresFor(geojson, {postal: 'HI'}), {
    id: 'hi',
    label: 'Hawaii',
    region: 'HI',
    parallels: [18, 22],
    origin: [-157.5, 20.5],
    contentWidth: 150,
    padding: 8
  });

  const output = {
    source: SOURCE,
    note: 'One frame per drawn region. us is the contiguous states. ak and hi are inset frames with their own extent and Albers fit. A frame with view "world" is ignored until the world view is built.',
    width: contiguous.width,
    height: contiguous.height,
    frames: [contiguous, alaska, hawaii]
  };

  fs.writeFileSync(OUT, `${JSON.stringify(output, null, 2)}\n`);
  console.log(
    `[checkins:map-outline] wrote ${OUT}: ${contiguous.states.length} states, ${contiguous.width}×${contiguous.height}; insets ${alaska.id} ${alaska.width}×${alaska.height}, ${hawaii.id} ${hawaii.width}×${hawaii.height}`
  );
};

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
