/**
 * Check-ins city map, data side. Groups the published `checkins` collection
 * by city, after the CHECKIN_MAP_EXCLUDE filter, and resolves every city to a
 * hand-checked centroid in `src/_data/cityCentroids.json`.
 *
 * Output carries city labels, counts, anchors, and tiers only. Coordinates
 * stay in the data file until the map projects them to SVG x/y at build.
 */
import crypto from 'node:crypto';
import path from 'node:path';
import {slugifyString} from '../filters/slugify.js';

export const EXCLUDE_ENV = 'CHECKIN_MAP_EXCLUDE';
export const TIERS = ['metro', 'town'];

const CENTROID_KEYS = ['lat', 'lon', 'tier'];

const WORD_ALIASES = {st: 'saint', ste: 'sainte', mt: 'mount', ft: 'fort'};

const COUNTRY_ALIASES = {
  usa: 'us',
  'united states': 'us',
  'united states of america': 'us'
};

const US_STATES = {
  alabama: 'al', alaska: 'ak', arizona: 'az', arkansas: 'ar', california: 'ca',
  colorado: 'co', connecticut: 'ct', delaware: 'de', 'district of columbia': 'dc',
  florida: 'fl', georgia: 'ga', hawaii: 'hi', idaho: 'id', illinois: 'il',
  indiana: 'in', iowa: 'ia', kansas: 'ks', kentucky: 'ky', louisiana: 'la',
  maine: 'me', maryland: 'md', massachusetts: 'ma', michigan: 'mi', minnesota: 'mn',
  mississippi: 'ms', missouri: 'mo', montana: 'mt', nebraska: 'ne', nevada: 'nv',
  'new hampshire': 'nh', 'new jersey': 'nj', 'new mexico': 'nm', 'new york': 'ny',
  'north carolina': 'nc', 'north dakota': 'nd', ohio: 'oh', oklahoma: 'ok',
  oregon: 'or', pennsylvania: 'pa', 'rhode island': 'ri', 'south carolina': 'sc',
  'south dakota': 'sd', tennessee: 'tn', texas: 'tx', utah: 'ut', vermont: 'vt',
  virginia: 'va', washington: 'wa', 'west virginia': 'wv', wisconsin: 'wi', wyoming: 'wy'
};

/** Lowercase, no accents or punctuation, and St./Ste./Mt./Ft. spelled out. */
export const normalizeName = value =>
  String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(word => WORD_ALIASES[word] ?? word)
    .join(' ');

const normalizeRegion = value => {
  const name = normalizeName(value);
  return US_STATES[name] ?? name;
};

const normalizeCountry = value => {
  const name = normalizeName(value);
  return COUNTRY_ALIASES[name] ?? name;
};

const keyParts = ({city, region, country}) => ({
  city: normalizeName(city),
  region: normalizeRegion(region),
  country: normalizeCountry(country)
});

export const cityKey = location => {
  const {city, region, country} = keyParts(location);
  return `${city}|${region}|${country}`;
};

/**
 * CHECKIN_MAP_EXCLUDE: entries split by `;` or newlines. Each entry is
 * `City|Region|Country` or `City|Region|Country|Place`. An empty or `*` field
 * matches anything. Never log the parsed rules or the raw value.
 */
export const parseExclusions = raw => {
  const entries = String(raw ?? '')
    .split(/[;\n]/)
    .map(entry => entry.trim())
    .filter(Boolean);

  return entries.map((entry, index) => {
    const fields = entry.split('|').map(field => field.trim());
    if (fields.length > 4) {
      throw new Error(`[checkins:map] ${EXCLUDE_ENV} entry ${index + 1} has more than four fields`);
    }
    const [city = '', region = '', country = '', place = ''] = fields;
    const pick = (value, normalize) => (value === '' || value === '*' ? null : normalize(value) || null);
    const rule = {
      city: pick(city, normalizeName),
      region: pick(region, normalizeRegion),
      country: pick(country, normalizeCountry),
      place: pick(place, normalizeName)
    };
    if (!rule.city && !rule.region && !rule.country && !rule.place) {
      throw new Error(`[checkins:map] ${EXCLUDE_ENV} entry ${index + 1} would match every check-in`);
    }
    return rule;
  });
};

/**
 * Reads CHECKIN_MAP_EXCLUDE. Production fails without it. Anywhere else the
 * build warns and returns null, and the city list is left out rather than
 * shown unfiltered on a public preview.
 */
export const loadExclusions = (env = process.env, log = console) => {
  const raw = env[EXCLUDE_ENV];
  if (raw && raw.trim()) return parseExclusions(raw);
  if (env.CONTEXT === 'production') {
    throw new Error(
      `[checkins:map] ${EXCLUDE_ENV} is not set. Production builds need it (see docs/checkins-map-project-plan.md).`
    );
  }
  log.warn(`[checkins:map] ${EXCLUDE_ENV} is not set, so this build leaves out the check-ins city list.`);
  return null;
};

// A blank field on the check-in matches any rule value, so a missing region can't slip past.
const fieldMatches = (ruleValue, value) => ruleValue === null || value === '' || ruleValue === value;

export const isExcluded = (data, rules) => {
  const {city, region, country} = keyParts(data);
  const place = data.place ? normalizeName(data.place) : '';

  return rules.some(rule => {
    if (!fieldMatches(rule.region, region) || !fieldMatches(rule.country, country)) return false;
    if (rule.place) return rule.place === place && fieldMatches(rule.city, city);
    if (rule.city === null || rule.city === city) return true;
    return rule.region === null && rule.country === null && rule.city === place;
  });
};

const isRounded = value => Math.abs(value * 10 - Math.round(value * 10)) < 1e-9;

/** Validates cityCentroids.json and indexes it by normalized city key. */
export const indexCentroids = centroids => {
  if (typeof centroids !== 'object' || centroids === null || Array.isArray(centroids)) {
    throw new Error('[checkins:map] cityCentroids.json must be an object keyed by "City|Region|Country"');
  }

  const index = new Map();
  const errors = [];

  for (const [key, value] of Object.entries(centroids)) {
    const parts = key.split('|');
    if (parts.length !== 3 || parts.some(part => part.trim() === '')) {
      errors.push(`"${key}" must be "City|Region|Country"`);
      continue;
    }
    const [city, region, country] = parts;
    if (!/^[A-Z]{2}$/.test(country)) errors.push(`"${key}" country must be two uppercase letters`);

    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      errors.push(`"${key}" must have lat, lon, and tier`);
      continue;
    }
    for (const field of Object.keys(value)) {
      if (!CENTROID_KEYS.includes(field)) errors.push(`"${key}" has an unknown key "${field}"`);
    }
    const {lat, lon, tier} = value;
    if (typeof lat !== 'number' || lat < -90 || lat > 90 || !isRounded(lat)) {
      errors.push(`"${key}" lat must be a number rounded to 0.1°`);
    }
    if (typeof lon !== 'number' || lon < -180 || lon > 180 || !isRounded(lon)) {
      errors.push(`"${key}" lon must be a number rounded to 0.1°`);
    }
    if (!TIERS.includes(tier)) errors.push(`"${key}" tier must be ${TIERS.join(' or ')}`);

    const normalized = cityKey({city, region, country});
    if (index.has(normalized)) {
      errors.push(`"${key}" and "${index.get(normalized).key}" are the same city (ambiguous)`);
      continue;
    }
    index.set(normalized, {key, city, region, country, lat, lon, tier});
  }

  if (errors.length) throw new Error(`[checkins:map] invalid cityCentroids.json:\n  - ${errors.join('\n  - ')}`);
  return index;
};

const findCentroids = (index, data) => {
  const parts = keyParts(data);
  if (parts.region) {
    const match = index.get(`${parts.city}|${parts.region}|${parts.country}`);
    return match ? [match] : [];
  }
  return [...index.values()].filter(entry => {
    const entryParts = keyParts(entry);
    return entryParts.city === parts.city && entryParts.country === parts.country;
  });
};

const publishAfterMs = value => (value instanceof Date ? value.getTime() : Date.parse(String(value)));

const fileSlugOf = item => item.fileSlug ?? path.basename(String(item.inputPath ?? ''), '.md');

/** Stable, opaque id for a check-in on /checkins/. Hashed so the anchor never carries the visit date. */
export const checkinAnchor = item =>
  `checkin-${crypto.createHash('sha256').update(fileSlugOf(item)).digest('hex').slice(0, 10)}`;

const capitalize = value => value.charAt(0).toUpperCase() + value.slice(1);

const checkinLabel = data => {
  if (data.precision === 'place' && data.place) return data.place;
  if (typeof data.kind === 'string' && data.kind.trim()) return capitalize(data.kind.trim());
  return 'Check-in';
};

const citySlug = ({city, region, country}) =>
  `city-${slugifyString([city, region, country === 'US' ? '' : country].filter(Boolean).join(' '))}`;

const byLabel = (a, b) => a.label.localeCompare(b.label, 'en');

/**
 * Published, non-excluded check-ins grouped by city, sorted by city name.
 * Drafts and future entries are dropped again here even though the
 * collection already removes them. Throws on a missing or ambiguous centroid,
 * or on a centroid that matches an exclusion.
 */
export const buildCheckinCities = (items, {centroids, exclusions, now = Date.now()}) => {
  if (!exclusions) return [];

  const index = indexCentroids(centroids);
  if ([...index.values()].some(entry => isExcluded(entry, exclusions))) {
    throw new Error(
      `[checkins:map] cityCentroids.json has an entry that matches ${EXCLUDE_ENV}. Excluded cities never get a centroid.`
    );
  }

  const groups = new Map();
  const errors = [];

  for (const item of items ?? []) {
    const data = item.data ?? {};
    if (data.draft === true) continue;
    if (!(publishAfterMs(data.publishAfter) <= now)) continue;
    if (isExcluded(data, exclusions)) continue;

    const matches = findCentroids(index, data);
    const where = [data.city, data.region, data.country].filter(Boolean).join('|');
    if (matches.length !== 1) {
      errors.push(`${item.inputPath}: ${matches.length ? 'ambiguous' : 'no'} centroid for "${where}"`);
      continue;
    }

    const centroid = matches[0];
    if (!groups.has(centroid.key)) {
      groups.set(centroid.key, {
        slug: citySlug(centroid),
        label: centroid.region ? `${centroid.city}, ${centroid.region}` : centroid.city,
        tier: centroid.tier,
        checkins: []
      });
    }
    groups.get(centroid.key).checkins.push({anchor: checkinAnchor(item), label: checkinLabel(data)});
  }

  if (errors.length) {
    throw new Error(
      `[checkins:map] add these cities to src/_data/cityCentroids.json (never guess or geocode):\n  - ${errors.join('\n  - ')}`
    );
  }

  return [...groups.values()].sort(byLabel).map(group => {
    const count = group.checkins.length;
    return {
      ...group,
      count,
      countLabel: `${count} check-in${count === 1 ? '' : 's'}`,
      checkins: group.checkins.sort(byLabel)
    };
  });
};
