import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

export const CHECKINS_DIR = './src/checkins';

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
  'draft'
];
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

const problemsFor = data => {
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
    const problems = problemsFor(data);
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

/** True once the entry's publishAfter has passed at build time. */
export const isPublished = (publishAfterByPath, inputPath, now = Date.now()) => {
  const publishAfter = publishAfterByPath.get(path.normalize(inputPath));
  return publishAfter !== undefined && publishAfter <= now;
};
