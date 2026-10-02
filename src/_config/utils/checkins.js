import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import sharp from 'sharp';

export const CHECKINS_DIR = './src/checkins';
export const IMAGES_DIR = './src/assets/images/checkins';

/** The check-in image contract. 250 KB is read as 250,000 bytes. */
export const IMAGE_SPEC = {format: 'webp', width: 1600, height: 1067, maxBytes: 250_000};

const ALLOWED_KEYS = [
  'date',
  'publishAfter',
  'place',
  'city',
  'region',
  'country',
  'precision',
  'kind',
  'source',
  'image',
  'draft'
];
const IMAGE_KEYS = ['day', 'night', 'alt'];
const REQUIRED_KEYS = ['date', 'publishAfter', 'city', 'country', 'precision'];
const STRING_KEYS = ['place', 'city', 'region', 'kind'];

const DATE_PATTERN = /^(\d{4}-\d{2}-\d{2})$/;
const PUBLISH_AFTER_PATTERN = /^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}(:\d{2})?[+-]\d{2}:\d{2}$/;
const ON_THE_HOUR_PATTERN = /T\d{2}:00(:00)?[+-]/;

/**
 * Reads an entry's own front matter, not Eleventy's merged `item.data`.
 * JSON_SCHEMA keeps timestamps as strings so the raw offset can be checked.
 */
const readFrontMatter = filePath => {
  const source = fs.readFileSync(filePath, 'utf8');
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  return yaml.load(match[1], {schema: yaml.JSON_SCHEMA}) ?? {};
};

const imageProblemsFor = (image, slug) => {
  if (typeof image !== 'object' || image === null || Array.isArray(image)) {
    return ['"image" must have day, night, and alt'];
  }

  const problems = [];
  for (const key of Object.keys(image)) {
    if (!IMAGE_KEYS.includes(key)) problems.push(`"image.${key}" is not an allowed key`);
  }
  for (const key of IMAGE_KEYS) {
    if (typeof image[key] !== 'string' || image[key].trim() === '') {
      problems.push(`"image.${key}" is required (day, night, and alt go together)`);
    }
  }

  for (const variant of ['day', 'night']) {
    if (typeof image[variant] !== 'string' || image[variant].trim() === '') continue;
    const expected = `${slug}-${variant}.webp`;
    if (image[variant] !== expected) {
      problems.push(`"image.${variant}" must be "${expected}"`);
    } else if (!fs.existsSync(path.join(IMAGES_DIR, expected))) {
      problems.push(`"image.${variant}" file is missing: ${path.join(IMAGES_DIR, expected)}`);
    }
  }

  return problems;
};

const problemsFor = (data, slug) => {
  if (data === null) return ['no front matter'];
  if (typeof data !== 'object' || Array.isArray(data)) return ['front matter is not a key/value map'];

  const problems = [];

  for (const key of Object.keys(data)) {
    if (!ALLOWED_KEYS.includes(key)) problems.push(`"${key}" is not an allowed key`);
  }
  for (const key of REQUIRED_KEYS) {
    if (data[key] === undefined || data[key] === null || data[key] === '')
      problems.push(`"${key}" is required`);
  }
  for (const key of STRING_KEYS) {
    if (data[key] !== undefined && typeof data[key] !== 'string') problems.push(`"${key}" must be text`);
  }

  if (data.date !== undefined && !DATE_PATTERN.test(String(data.date))) {
    problems.push('"date" must be YYYY-MM-DD');
  }
  if (data.country !== undefined && !/^[A-Z]{2}$/.test(String(data.country))) {
    problems.push('"country" must be a two-letter ISO code like US');
  }

  if (data.publishAfter !== undefined) {
    const raw = String(data.publishAfter);
    const parsed = raw.match(PUBLISH_AFTER_PATTERN);
    if (!parsed) {
      problems.push('"publishAfter" must look like 2024-04-01T15:00:00-05:00 (UTC offset required)');
    } else {
      if (!ON_THE_HOUR_PATTERN.test(raw)) problems.push('"publishAfter" must be on the hour');
      if (Number.isNaN(Date.parse(raw))) problems.push('"publishAfter" is not a real date and time');
      if (DATE_PATTERN.test(String(data.date)) && parsed[1] <= String(data.date)) {
        problems.push('"publishAfter" must be at least the day after "date"');
      }
    }
  }

  if (data.precision === 'city' && data.place !== undefined)
    problems.push('precision "city" must not have a "place"');
  if (data.precision === 'place' && !data.place) problems.push('precision "place" needs a "place"');
  if (data.precision !== undefined && !['place', 'city'].includes(data.precision)) {
    problems.push('"precision" must be "place" or "city"');
  }
  if (data.source !== undefined && !['hand', 'bot'].includes(data.source))
    problems.push('"source" must be "hand" or "bot"');
  if (data.draft !== undefined && typeof data.draft !== 'boolean')
    problems.push('"draft" must be true or false');
  if (data.image !== undefined) problems.push(...imageProblemsFor(data.image, slug));

  return problems;
};

/**
 * Validates every Markdown file in `src/checkins/`, drafts included, and
 * throws one error listing every bad file. Returns publishAfter (ms) by path.
 */
export const validateCheckins = (dir = CHECKINS_DIR) => {
  if (!fs.existsSync(dir)) return new Map();

  const files = fs
    .readdirSync(dir, {recursive: true})
    .filter(file => file.endsWith('.md'))
    .map(file => path.join(dir, file));

  const publishAfterByPath = new Map();
  const errors = [];

  for (const file of files) {
    const data = readFrontMatter(file);
    const problems = problemsFor(data, path.basename(file, '.md'));
    if (problems.length) {
      errors.push(`${file}\n  - ${problems.join('\n  - ')}`);
      continue;
    }
    publishAfterByPath.set(path.normalize(file), Date.parse(String(data.publishAfter)));
  }

  if (errors.length) {
    throw new Error(`[checkins] invalid check-in front matter:\n${errors.join('\n')}`);
  }

  return publishAfterByPath;
};

const exiftoolAvailable = () => spawnSync('exiftool', ['-ver'], {encoding: 'utf8'}).status === 0;

/**
 * Problems with one image file against IMAGE_SPEC. EXIF covers GPS: WebP keeps
 * GPS inside its EXIF chunk, so "no EXIF" also means "no GPS".
 */
export const imageFileProblems = async filePath => {
  if (path.extname(filePath).toLowerCase() !== '.webp') {
    return ['only .webp files belong here (originals are never committed)'];
  }

  const problems = [];
  const bytes = fs.statSync(filePath).size;
  if (bytes > IMAGE_SPEC.maxBytes)
    problems.push(`${bytes} bytes is over the ${IMAGE_SPEC.maxBytes}-byte limit`);

  let meta;
  try {
    meta = await sharp(filePath).metadata();
  } catch (error) {
    return [...problems, `can't be read as an image (${error.message})`];
  }

  if (meta.format !== IMAGE_SPEC.format) problems.push(`format is ${meta.format}, not ${IMAGE_SPEC.format}`);
  if (meta.width !== IMAGE_SPEC.width || meta.height !== IMAGE_SPEC.height) {
    problems.push(`is ${meta.width}×${meta.height}, must be ${IMAGE_SPEC.width}×${IMAGE_SPEC.height}`);
  }
  if (meta.exif) problems.push('has EXIF data (which can carry GPS)');
  if (meta.xmp) problems.push('has XMP data');

  return problems;
};

/**
 * Checks every file in `src/assets/images/checkins/`, referenced or not, and
 * throws one error listing every bad file. Uses exiftool for GPS too when it's
 * installed; the sharp check alone is what CI relies on.
 */
export const validateCheckinImages = async (dir = IMAGES_DIR) => {
  if (!fs.existsSync(dir)) return;

  const files = fs
    .readdirSync(dir, {recursive: true})
    .map(file => path.join(dir, file))
    .filter(file => fs.statSync(file).isFile() && path.basename(file) !== '.gitkeep');

  const errors = [];
  for (const file of files) {
    const problems = await imageFileProblems(file);
    if (problems.length) errors.push(`${file}\n  - ${problems.join('\n  - ')}`);
  }

  if (files.length && exiftoolAvailable()) {
    const result = spawnSync('exiftool', ['-json', '-a', '-gps:all', ...files], {encoding: 'utf8'});
    const tagged = JSON.parse(result.stdout || '[]').filter(entry => Object.keys(entry).length > 1);
    for (const {SourceFile, ...gps} of tagged) {
      errors.push(`${SourceFile}\n  - exiftool -a -gps:all found ${Object.keys(gps).join(', ')}`);
    }
  }

  if (errors.length) {
    throw new Error(`[checkins] invalid check-in images:\n${errors.join('\n')}`);
  }
};

/** True once the entry's publishAfter has passed at build time. */
export const isPublished = (publishAfterByPath, inputPath, now = Date.now()) => {
  const publishAfter = publishAfterByPath.get(path.normalize(inputPath));
  return publishAfter !== undefined && publishAfter <= now;
};
