// Reads the Eleventy build in dist/ (this repo's output directory). No network.
// Run `npm run build` first. `npm run check` does that before this file.
import assert from 'node:assert/strict';
import {existsSync, readFileSync, readdirSync, statSync} from 'node:fs';
import path from 'node:path';
import {describe, it} from 'node:test';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const SITE_HOSTS = new Set(['stefantaitano.com']);

const KEY_PAGES = ['/', '/now/', '/chess/', '/checkins/', '/ai/', '/projects/', '/bookshelf/'];

const SECRET_ENVS = ['CHECKIN_REBUILD_HOOK_URL', 'CHECKIN_MAP_EXCLUDE'];

const walk = (dir, files = []) => {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
};

const htmlFiles = () => walk(DIST).filter(file => file.endsWith('.html'));

const urlForFile = file => {
  const rel = path.relative(DIST, file).split(path.sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  if (rel.endsWith('.html')) return `/${rel.slice(0, -'.html'.length)}`;
  return `/${rel}`;
};

const insideDist = file => {
  const resolved = path.resolve(file);
  return resolved === DIST || resolved.startsWith(`${DIST}${path.sep}`);
};

const isFile = file => {
  if (!insideDist(file)) return false;
  try {
    return statSync(file).isFile();
  } catch {
    return false;
  }
};

/** A site path is built when it maps to a file Eleventy wrote. */
const builtFile = pathname => {
  let rel;
  try {
    rel = decodeURIComponent(pathname);
  } catch {
    return false;
  }
  rel = rel.replace(/^\/+/, '');
  if (rel === '' || rel === '/') return isFile(path.join(DIST, 'index.html'));

  const trimmed = rel.replace(/\/+$/, '');
  return (
    isFile(path.join(DIST, rel)) ||
    isFile(path.join(DIST, trimmed)) ||
    isFile(path.join(DIST, trimmed, 'index.html')) ||
    isFile(path.join(DIST, `${trimmed}.html`))
  );
};

const loadRedirects = () => {
  const file = path.join(DIST, '_redirects');
  if (!isFile(file)) return [];
  const rules = [];
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) continue;
    rules.push(parts[0]);
  }
  return rules;
};

const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const redirectMatches = (rule, pathname) => {
  const candidates = pathname.endsWith('/') ? [pathname, pathname.slice(0, -1)] : [pathname, `${pathname}/`];
  if (!rule.includes('*') && !rule.includes(':')) return candidates.includes(rule);

  const body = rule
    .split('*')
    .map(part => escapeRegex(part))
    .join('(.*)')
    .replace(/:([A-Za-z0-9_]+)/g, '([^/]+)');
  const re = new RegExp(`^${body}$`);
  return candidates.some(candidate => re.test(candidate));
};

const hrefsIn = html => {
  const found = [];
  const re = /<[^>]*?\shref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi;
  for (const match of html.matchAll(re)) found.push(match[1] ?? match[2] ?? match[3] ?? '');
  return found;
};

const sameSitePath = href => {
  try {
    const url = new URL(href);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!SITE_HOSTS.has(url.hostname.replace(/^www\./, ''))) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
};

/** Root-relative or page-relative href, or a same-site absolute URL. External links are skipped. */
const internalPath = (href, pageUrl) => {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:') || href.startsWith('data:')) {
    return null;
  }
  if (href.startsWith('//')) return null;

  const absolute = sameSitePath(href);
  if (absolute) return absolute.split('#')[0];
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return null;

  const base = new URL(pageUrl, 'https://stefantaitano.com');
  const url = new URL(href, base);
  return `${url.pathname}${url.search}`.split('#')[0];
};

const urlsInSrcset = value =>
  value
    .split(',')
    .map(part => part.trim().split(/\s+/)[0])
    .filter(Boolean);

const checkinImageUrls = html => {
  const urls = new Set();
  const take = block => {
    const attr = /(?:src|srcset)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
    for (const match of block.matchAll(attr)) {
      const raw = match[1] ?? match[2] ?? '';
      const name = match[0].trimStart().toLowerCase();
      const values = name.startsWith('srcset') ? urlsInSrcset(raw) : [raw];
      for (const value of values) {
        const pathOnly = value.split('?')[0].split('#')[0];
        if (pathOnly.startsWith('/')) urls.add(pathOnly);
      }
    }
  };

  for (const match of html.matchAll(/<picture\b[^>]*>[\s\S]*?<\/picture>/gi)) {
    const block = match[0];
    if (/checkin-figure__img|data-variant=|\/assets\/images\/checkins\//.test(block)) take(block);
  }
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0];
    if (/checkin-figure__img|data-variant=|\/assets\/images\/checkins\//.test(tag)) take(tag);
  }
  for (const match of html.matchAll(/\/assets\/images\/checkins\/[^\s"'<>)]+/g)) {
    urls.add(match[0].split('?')[0]);
  }
  return [...urls];
};

/**
 * Drop styles, scripts, and SVG geometry before the broad decimal checks.
 * Inlined CSS contains values such as 1.0625. Wording and centroid pairs are
 * checked on the raw HTML, so a coordinate inside a script or a path stays visible.
 */
const markupForDecimals = html =>
  html
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/\sstyle\s*=\s*"[^"]*"/gi, '')
    .replace(/\sstyle\s*=\s*'[^']*'/gi, '')
    .replace(/\sd\s*=\s*"[^"]*"/gi, '')
    .replace(/\sd\s*=\s*'[^']*'/gi, '')
    .replace(/\spoints\s*=\s*"[^"]*"/gi, '')
    .replace(/\spoints\s*=\s*'[^']*'/gi, '');

const centroidNeedles = () => {
  const file = path.join(ROOT, 'src/_data/cityCentroids.json');
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const needles = [];
  for (const value of Object.values(data)) {
    if (!value || typeof value.lat !== 'number' || typeof value.lon !== 'number') continue;
    needles.push([String(value.lat), String(value.lon)]);
  }
  return needles;
};

/** A lat, lon pair in decimal degrees. Chart geometry is stripped before this runs. */
const hasCoordinatePair = html => {
  const re = /(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/g;
  for (const match of html.matchAll(re)) {
    const lat = Number(match[1]);
    const lon = Number(match[2]);
    if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) return true;
  }
  return false;
};

const numberPresent = (html, raw) => {
  const escaped = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // A percentage such as 45.0% is a bar width, not a coordinate.
  const re = new RegExp(`(?<![\\w.])${escaped}(?!%)(?![\\w.])`, 'g');
  return re.test(html);
};

const hasCoordinateWording = html => /\b(latitude|longitude|coords?)\b/i.test(html) || /\b(lat|lon|lng)\b/.test(html);

/** Wording and centroid pairs use the raw HTML. Broad decimals use the stripped copy. */
const coordinateHits = html => {
  const hits = [];
  if (hasCoordinateWording(html)) hits.push('coordinate wording');
  for (const [lat, lon] of centroidNeedles()) {
    if (numberPresent(html, lat) && numberPresent(html, lon)) {
      hits.push('city centroid pair');
      break;
    }
  }

  const decimals = markupForDecimals(html);
  if (hasCoordinatePair(decimals)) hits.push('coordinate pair');
  if (/-?\d{1,3}\.\d{4,}/.test(decimals)) hits.push('precise decimal');
  return hits;
};

describe('built site', () => {
  it('has a dist/ build to read', () => {
    assert.ok(
      isFile(path.join(DIST, 'index.html')),
      'dist/index.html is missing. Run npm run build before npm run smoke.'
    );
  });

  it('renders key pages and every built check-in page with a title and an h1', () => {
    const checkinPages = htmlFiles()
      .filter(file => {
        const rel = path.relative(DIST, file).split(path.sep).join('/');
        return rel === 'checkins/index.html' || rel.startsWith('checkins/');
      })
      .map(urlForFile);
    const routes = [...new Set([...KEY_PAGES, ...checkinPages])];

    const missing = [];
    for (const route of routes) {
      const pathname = route.split('?')[0].split('#')[0];
      if (!builtFile(pathname)) {
        missing.push(`${route}: no built file`);
        continue;
      }
      const file =
        pathname === '/'
          ? path.join(DIST, 'index.html')
          : [path.join(DIST, pathname.replace(/^\/+/, '').replace(/\/+$/, ''), 'index.html'), path.join(DIST, `${pathname.replace(/^\/+|\/+$/g, '')}.html`)].find(isFile);
      const html = readFileSync(file, 'utf8');
      const title = html.match(/<title>([\s\S]*?)<\/title>/i);
      if (!title || !title[1].replace(/\s+/g, ' ').trim()) missing.push(`${route}: no title`);
      if (!/<h1\b[^>]*>[\s\S]*?\S[\s\S]*?<\/h1>/i.test(html)) missing.push(`${route}: no h1`);
    }

    assert.deepEqual(missing, []);
    assert.ok(routes.length >= KEY_PAGES.length);
  });

  it('resolves internal links to a built file or a _redirects rule', () => {
    assert.ok(isFile(path.join(DIST, '_redirects')), 'dist/_redirects was not built');
    const rules = loadRedirects();
    const broken = [];

    for (const file of htmlFiles()) {
      // The RubyConf deck is a vendored slide bundle. Its links are not site routes.
      const rel = path.relative(DIST, file).split(path.sep).join('/');
      if (rel.startsWith('talks/') && rel.includes('/slides/')) continue;

      const pageUrl = urlForFile(file);
      for (const href of hrefsIn(readFileSync(file, 'utf8'))) {
        const target = internalPath(href, pageUrl);
        if (!target) continue;
        const pathname = target.split('?')[0];
        if (builtFile(pathname)) continue;
        if (rules.some(rule => redirectMatches(rule, pathname))) continue;
        broken.push(`${pageUrl} -> ${href}`);
      }
    }

    assert.deepEqual(broken, []);
  });

  it('serves every check-in image the HTML references', () => {
    const missing = [];
    const seen = new Set();

    for (const file of htmlFiles()) {
      for (const urlPath of checkinImageUrls(readFileSync(file, 'utf8'))) {
        seen.add(urlPath);
        if (!builtFile(urlPath.split('?')[0])) missing.push(`${urlForFile(file)} -> ${urlPath}`);
      }
    }

    assert.deepEqual(missing, []);
    assert.ok(seen.size > 0, 'built HTML references no check-in images');
  });

  it('renders check-in cities on the map', () => {
    const html = readFileSync(path.join(DIST, 'checkins', 'index.html'), 'utf8').replace(
      /<style\b[^>]*>[\s\S]*?<\/style>/gi,
      ''
    );
    assert.match(html, /<figure[^>]*class="checkins-map"/, 'check-ins page has no map');
    assert.match(html, /<circle[^>]*class="checkins-map__bead"/, 'check-ins map rendered no city beads');
    assert.match(html, /<li[^>]*class="checkins-city"/, 'check-ins page rendered no cities');
  });

  it('keeps check-in coordinates and secret env values out of the HTML', () => {
    const hits = [];

    for (const file of htmlFiles()) {
      const where = urlForFile(file);
      for (const hit of coordinateHits(readFileSync(file, 'utf8'))) hits.push(`${where}: ${hit}`);
    }

    assert.deepEqual(hits, []);

    for (const name of SECRET_ENVS) {
      const value = process.env[name];
      if (typeof value !== 'string' || value.trim() === '') continue;
      for (const file of htmlFiles()) {
        const html = readFileSync(file, 'utf8');
        assert.ok(!html.includes(value), `${urlForFile(file)} contains the ${name} value`);
      }
    }
  });
});

describe('coordinate scan', () => {
  it('catches a coordinate planted in a script or a path', () => {
    const script = '<p>Fine</p><script>const latitude = 1;</script>';
    assert.ok(coordinateHits(script).includes('coordinate wording'));

    const pathD = '<svg><path d="37.8,-122.4" /></svg>';
    assert.ok(coordinateHits(pathD).includes('city centroid pair'));
  });
});
