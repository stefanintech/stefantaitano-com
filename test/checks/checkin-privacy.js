/**
 * Check-in privacy gaps that the build does not already cover.
 *
 * Skipped here, because they already fail a build or a CI job:
 * - lat, lng, latitude, longitude, coordinates, and any other extra key in
 *   check-in markdown front matter. validateCheckins in
 *   src/_config/utils/checkins.js allowlists the keys, and getCheckins runs
 *   that during npm run build.
 * - GPS, EXIF, and XMP in committed WebP images. Every committed .webp is in
 *   src/assets/images/checkins/. imageFileProblems rejects EXIF and XMP, and
 *   validateCheckinImages also runs `exiftool -gps:all` when exiftool is
 *   installed. The build runs that check, and the checkins CI job runs
 *   `npm run checkins:images -- --check`.
 * - Coordinate wording, city-centroid pairs, and precise decimals in built
 *   HTML. test/smoke.test.js already scans dist/ for those.
 *
 * This file checks two gaps:
 * - A check-in whose publishAfter is still in the future showing up in the
 *   build output. Fixture builds cover the home stream and /checkins/
 *   templates; they do not read dist/ after npm run build.
 * - lat, lng, lon, latitude, longitude, coordinates, or coords as a key in
 *   check-in data files (JSON or YAML under src/checkins/). Directory data
 *   is merged onto every entry, and the markdown allowlist does not read it.
 *   City centroids and the map outline are not check-in entries; they are
 *   not scanned here.
 *
 * A future entry counts as included when the build text contains any of:
 * the publishAfter timestamp, the filename slug, the checkin- anchor
 * (the same hash the templates emit), the place, an image filename, or a
 * note of at least 12 characters. The city and the visit date are not
 * markers: both already appear on other pages.
 */
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import {checkinAnchor} from '../../src/_config/utils/checkin-map.js';

const COORDINATE_KEYS = new Set(['lat', 'lng', 'lon', 'latitude', 'longitude', 'coordinates', 'coords']);
const DATA_EXTENSIONS = new Set(['.json', '.yaml', '.yml']);
const NOTE_MARKER_LENGTH = 12;

/**
 * @param {unknown} value
 * @param {string} where
 * @returns {string[]}
 */
export const coordinateKeyProblems = (value, where) => {
  const problems = [];

  const walk = (node, trail) => {
    if (Array.isArray(node)) {
      node.forEach((item, index) => walk(item, `${trail}[${index}]`));
      return;
    }
    if (!node || typeof node !== 'object') return;

    for (const [key, child] of Object.entries(node)) {
      const next = trail ? `${trail}.${key}` : key;
      if (COORDINATE_KEYS.has(key.toLowerCase())) problems.push(`${where}: ${next}`);
      walk(child, next);
    }
  };

  walk(value, '');
  return problems;
};

const readData = (file, text) => {
  const extension = path.extname(file).toLowerCase();
  try {
    if (extension === '.json') return JSON.parse(text);
    return yaml.load(text, {schema: yaml.JSON_SCHEMA});
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[checkin-privacy] ${file} could not be parsed (${message})`, {cause: error});
  }
};

/**
 * Coordinate keys in JSON/YAML check-in data. Markdown front matter is left
 * to validateCheckins.
 * @param {string} dir
 * @returns {string[]}
 */
export const checkinDataCoordinateProblems = dir => {
  if (!fs.existsSync(dir)) return [];

  const files = fs
    .readdirSync(dir, {recursive: true, encoding: 'utf8'})
    .map(file => path.join(dir, file))
    .filter(file => fs.statSync(file).isFile() && DATA_EXTENSIONS.has(path.extname(file).toLowerCase()))
    .sort();

  const problems = [];
  for (const file of files) {
    const parsed = readData(file, fs.readFileSync(file, 'utf8'));
    problems.push(...coordinateKeyProblems(parsed, path.basename(file)));
  }
  return problems;
};

const frontMatterOf = source => {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const data = yaml.load(match[1], {schema: yaml.JSON_SCHEMA}) ?? {};
  return {data, note: source.slice(match[0].length).trim()};
};

/**
 * @param {string} dir
 * @returns {{slug: string, place: string, note: string, images: string[], publishAfter: string}[]}
 */
export const readCheckinEntries = dir => {
  if (!fs.existsSync(dir)) return [];

  const files = fs
    .readdirSync(dir, {recursive: true, encoding: 'utf8'})
    .filter(file => file.endsWith('.md'))
    .sort();

  return files.map(file => {
    const full = path.join(dir, file);
    const parsed = frontMatterOf(fs.readFileSync(full, 'utf8'));
    if (!parsed) throw new Error(`[checkin-privacy] ${full} has no front matter`);

    const {data, note} = parsed;
    const images = [];
    if (data.image && typeof data.image === 'object') {
      for (const variant of ['day', 'night']) {
        const name = data.image[variant];
        if (typeof name === 'string' && name.trim()) images.push(name.trim());
      }
    }

    return {
      slug: path.basename(file, '.md'),
      place: typeof data.place === 'string' ? data.place.trim() : '',
      note,
      images,
      publishAfter: data.publishAfter == null ? '' : String(data.publishAfter)
    };
  });
};

const markersFor = entry => {
  const markers = [];
  if (entry.publishAfter) markers.push(entry.publishAfter);
  if (entry.slug) markers.push(entry.slug);
  markers.push(checkinAnchor({fileSlug: entry.slug}));
  if (entry.place) markers.push(entry.place);
  if (entry.note.trim().length >= NOTE_MARKER_LENGTH) markers.push(entry.note.trim());
  for (const image of entry.images) markers.push(image);
  return markers.filter(marker => marker.trim().length >= 3);
};

const isFuture = (entry, now) => {
  const ms = Date.parse(entry.publishAfter);
  return !Number.isNaN(ms) && ms > now;
};

/**
 * @param {{
 *   entries: {slug: string, place: string, note: string, images: string[], publishAfter: string}[],
 *   files: {file: string, text: string}[],
 *   now?: number
 * }} options
 * @returns {{slug: string, file: string, marker: string}[]}
 */
export const futureCheckinLeaks = ({entries, files, now = Date.now()}) => {
  const leaks = [];

  for (const entry of entries) {
    if (!isFuture(entry, now)) continue;
    for (const output of files) {
      for (const marker of markersFor(entry)) {
        if (output.text.includes(marker)) leaks.push({slug: entry.slug, file: output.file, marker});
      }
    }
  }

  return leaks;
};
