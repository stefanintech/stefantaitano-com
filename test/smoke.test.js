// Reads the Eleventy build in dist/ (this repo's output directory). No network.
// Run `npm run build` first. `npm run check` does that before this file.
import assert from 'node:assert/strict';
import {existsSync, readFileSync, readdirSync, statSync} from 'node:fs';
import path from 'node:path';
import {describe, it} from 'node:test';
import {fileURLToPath} from 'node:url';
import {assertAltText} from './checks/alt-text.js';
import {futureCheckinLeaks, readCheckinEntries} from './checks/checkin-privacy.js';
import yaml from 'js-yaml';
// The crew data and vendor checks need no build, but run with npm run smoke.
import './crew.test.js';

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

const fileForRoute = route => {
  if (route === '/') return path.join(DIST, 'index.html');
  return path.join(DIST, route.replace(/^\/+|\/+$/g, ''), 'index.html');
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

  it('gives every image an alt, or marks an empty alt as decorative', () => {
    const pages = htmlFiles().map(file => ({page: urlForFile(file), html: readFileSync(file, 'utf8')}));
    assert.ok(pages.length > 0, 'dist/ has no HTML pages');
    assertAltText(pages);
  });

  it('leaves check-ins with a future publishAfter out of the build', () => {
    const entries = readCheckinEntries(path.join(ROOT, 'src/checkins'));
    assert.ok(entries.length > 0, 'no check-ins were read');
    const files = walk(DIST)
      .filter(file => /\.(html|xml|json|txt|svg|md)$/i.test(file))
      .map(file => ({file: urlForFile(file), text: readFileSync(file, 'utf8')}));
    assert.deepEqual(futureCheckinLeaks({entries, files}), []);
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

describe('crew section', () => {
  const crew = /** @type {any} */ (yaml.load(readFileSync(path.join(ROOT, 'src/_data/crew.yaml'), 'utf8')));
  const aiHtml = () => readFileSync(path.join(DIST, 'ai', 'index.html'), 'utf8');
  const section = () => {
    const match = aiHtml().match(/<section\b[^>]*\bid="crew"[^>]*>([\s\S]*?)<\/section>/);
    assert.ok(match, '/ai/ has no section with id="crew"');
    return match[1];
  };
  const textOf = html => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  it('renders the heading, the sample note, and one card per crew.yaml member', () => {
    const html = section();
    assert.match(html, /<h2\b[^>]*>\s*The crew\s*<\/h2>/);
    assert.match(html, /Sample statuses, not live\./);

    const cards = [...html.matchAll(/<li\b[^>]*class="crew-card"[^>]*>([\s\S]*?)<\/li>/g)].map(match => match[1]);
    assert.equal(cards.length, 5);
    assert.equal(cards.length, crew.members.length);

    crew.members.forEach((member, index) => {
      const card = cards[index];
      const name = card.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/);
      assert.equal(name && textOf(name[1]), member.name);
      assert.ok(textOf(card).includes(member.job), `${member.slug}: job line missing`);
      const pill = card.match(/<span\b([^>]*\bclass="crew-pill"[^>]*)>([\s\S]*?)<\/span>/);
      assert.ok(pill, `${member.slug}: no state pill`);
      assert.match(pill[1], new RegExp(`\\bdata-state="${member.state}"`));
      assert.equal(textOf(pill[2]), member.state);
      assert.match(card, /data-crew-avatar="/, `${member.slug}: no avatar host`);
    });
  });

  it('sits after the workflows and before What I\'m learning', () => {
    const html = aiHtml();
    const crewAt = html.indexOf('id="crew"');
    const lastWorkflow = html.lastIndexOf('class="ai-workflow');
    const learning = html.indexOf('id="ai-learning"');
    assert.ok(lastWorkflow > -1 && lastWorkflow < crewAt, 'crew is not after the workflows');
    assert.ok(learning > crewAt, 'crew is not before What I\'m learning');
  });

  it('loads the avatar scripts deferred, from self, on /ai and the /next-2027/ preview home only', () => {
    const scriptTags = html => [...html.matchAll(/<script\b[^>]*>/gi)].map(match => match[0]);
    const vendor = /src="\/assets\/scripts\/vendor\/open-bot-avatar\.js"/;
    const page = /src="\/assets\/scripts\/components\/crew-v2\.js"/;
    const avatarPages = ['/ai/', '/next-2027/'];

    for (const route of avatarPages) {
      const tags = scriptTags(readFileSync(fileForRoute(route), 'utf8'));
      for (const re of [vendor, page]) {
        const tag = tags.find(tagHtml => re.test(tagHtml));
        assert.ok(tag, `${route} does not load ${re}`);
        assert.match(tag, /\sdefer\b/, `${tag} is not deferred`);
      }
      assert.ok(
        tags.findIndex(tag => vendor.test(tag)) < tags.findIndex(tag => page.test(tag)),
        `${route}: crew-v2.js loads before the vendored script`
      );
    }

    const elsewhere = htmlFiles()
      .filter(file => !avatarPages.includes(urlForFile(file)))
      .filter(file => /open-bot-avatar|scripts\/components\/crew-v2\.js/.test(readFileSync(file, 'utf8')))
      .map(urlForFile);
    assert.deepEqual(elsewhere, []);

    assert.ok(isFile(path.join(DIST, 'assets/scripts/vendor/open-bot-avatar.js')), 'vendored script was not copied');
    assert.ok(isFile(path.join(DIST, 'assets/scripts/vendor/open-bot-avatar.LICENSE')), 'vendored license was not copied');
    assert.ok(isFile(path.join(DIST, 'assets/scripts/components/crew.js')), 'crew.js was not built');
    assert.ok(isFile(path.join(DIST, 'assets/scripts/components/crew-v2.js')), 'crew-v2.js was not built');
    for (const route of avatarPages) {
      assert.doesNotMatch(readFileSync(fileForRoute(route), 'utf8'), /src="\/assets\/scripts\/components\/crew\.js"/);
    }
  });

  it('gives the preview crew five colors and leaves /ai on the accent', () => {
    const slugs = ['bolt', 'inky', 'postcard', 'imogen', 'captain'];
    const home = readFileSync(fileForRoute('/next-2027/'), 'utf8');
    const cards = [...home.matchAll(/<li\b[^>]*\bdata-crew-card="([^"]+)"[^>]*>([\s\S]*?)<\/li>/g)];
    assert.deepEqual(cards.map(card => card[1]), slugs);
    const colors = cards.map(card => {
      const color = card[2].match(/data-crew-color="([^"]+)"/);
      assert.ok(color, `${card[1]} has no crew color`);
      return color[1];
    });
    assert.deepEqual(colors, slugs.map(slug => `var(--crew-${slug})`));
    assert.equal(new Set(colors).size, slugs.length);

    const css = readFileSync(path.join(ROOT, 'src/assets/css/rasa/next-2027.css'), 'utf8');
    const site = readFileSync(path.join(ROOT, 'src/assets/css/rasa/site.css'), 'utf8');
    const block = (source, pattern) => {
      const match = source.match(pattern);
      assert.ok(match, `missing ${pattern}`);
      return match[1];
    };
    const props = text => Object.fromEntries(
      [...text.matchAll(/--crew-([a-z]+):\s*(#[0-9a-f]{6})/g)].map(([, slug, hex]) => [slug, hex])
    );
    const light = props(block(css, /:root \{\s*([^}]*--crew-bolt:[^}]*)\}/));
    const systemDark = props(block(css, /:root:not\(\[data-theme='light'\]\) \{\s*([^}]*)\}/));
    const explicitDark = props(block(css, /:root\[data-theme='dark'\] \{\s*([^}]*)\}/));
    assert.deepEqual(Object.keys(light), slugs);
    assert.deepEqual(systemDark, explicitDark);
    assert.equal(new Set(Object.values(light)).size, slugs.length);
    assert.equal(new Set(Object.values(explicitDark)).size, slugs.length);
    for (const slug of slugs) assert.notEqual(light[slug], explicitDark[slug], `${slug} does not change with the theme`);

    const cardLight = site.match(/:root \{[^}]*--card:\s*(#[0-9a-f]{6})/)[1];
    const cardDark = site.match(/:root\[data-theme='dark'\] \{[^}]*--card:\s*(#[0-9a-f]{6})/)[1];
    const eye = '#151515';
    const channel = value => {
      const scaled = value / 255;
      return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
    };
    const luminance = hex => {
      const number = parseInt(hex.slice(1), 16);
      return 0.2126 * channel(number >> 16) + 0.7152 * channel((number >> 8) & 255) + 0.0722 * channel(number & 255);
    };
    const contrast = (a, b) => {
      const [lighter, darker] = [luminance(a), luminance(b)].sort((left, right) => right - left);
      return (lighter + 0.05) / (darker + 0.05);
    };
    for (const slug of slugs) {
      assert.ok(contrast(light[slug], cardLight) >= 3, `${slug} light is under 3:1 on the card`);
      assert.ok(contrast(explicitDark[slug], cardDark) >= 3, `${slug} dark is under 3:1 on the card`);
      assert.ok(contrast(light[slug], eye) >= 3, `${slug} light hides the eyes`);
      assert.ok(contrast(explicitDark[slug], eye) >= 3, `${slug} dark hides the eyes`);
      assert.match(home, new RegExp(`--crew-${slug}:${light[slug]}`));
      assert.match(home, new RegExp(`--crew-${slug}:${explicitDark[slug]}`));
    }

    const ai = aiHtml();
    assert.doesNotMatch(ai, /data-crew-color|--crew-bolt/);
    const script = readFileSync(path.join(DIST, 'assets/scripts/components/crew-v2.js'), 'utf8');
    assert.match(script, /var\(--accent\)/);
    assert.match(script, /crewColor/);
  });
});

describe('2027 preview mockup', () => {
  const boardPath = path.join(ROOT, 'src/_data/next2027Board.json');
  const boardTemplate = path.join(ROOT, 'src/_includes/next-2027/crew-board.njk');
  const previewRoutes = ['/next-2027/', '/next-2027/now/', '/next-2027/now/archive/'];

  const postcardCard = html => {
    const match = html.match(/<li\b[^>]*\bdata-crew-card="postcard"[^>]*>[\s\S]*?<\/li>/);
    assert.ok(match, 'preview home has no postcard card');
    return match[0];
  };

  it('keeps postcard to a fixed line with no time in the sample file or the template', () => {
    const board = JSON.parse(readFileSync(boardPath, 'utf8'));
    assert.equal(board.source, 'sample');
    assert.deepEqual(
      board.members.map(member => member.slug),
      ['bolt', 'inky', 'postcard', 'imogen', 'captain']
    );

    for (const member of board.members) {
      if (member.slug === 'postcard') {
        assert.deepEqual(Object.keys(member).sort(), ['line', 'slug']);
        assert.equal(member.line, 'check-ins post a day later');
      } else {
        assert.deepEqual(Object.keys(member).sort(), ['doing', 'lastJobAt', 'lastJobLabel', 'slug']);
        assert.match(member.lastJobLabel, /^[A-Z][a-z]{2} \d{1,2}, \d{4}, \d{1,2}:\d{2} [AP]M CT$/);
        assert.doesNotMatch(`${member.doing} ${member.lastJobLabel}`, /mail|calendar|inbox|finance|UTC/i);
      }
    }

    const template = readFileSync(boardTemplate, 'utf8');
    const start = template.indexOf("card.slug == 'postcard'");
    const branch = template.slice(start, template.indexOf('{%- else %}', start));
    assert.ok(start > -1, 'postcard branch missing');
    assert.match(branch, /check-ins post a day later/);
    assert.doesNotMatch(branch, /lastJob|<time|doing/);
  });

  it('renders the preview pages with noindex, a sample board, and postcard without a time', () => {
    const home = readFileSync(fileForRoute('/next-2027/'), 'utf8');
    const now = readFileSync(fileForRoute('/next-2027/now/'), 'utf8');
    const archive = readFileSync(fileForRoute('/next-2027/now/archive/'), 'utf8');

    for (const html of [home, now, archive]) {
      assert.match(html, /name="robots" content="noindex, nofollow"/);
      assert.match(html, /Preview mockup\. Not the live site\./);
      assert.match(html, /<summary>More<\/summary>/);
      assert.match(html, /href="\/resume\/"/);
      assert.match(html, /href="\/feed\.xml"/);
      assert.match(html, /href="\/feed\.json"/);
      assert.match(html, /href="\/privacy\/"/);
      assert.match(html, /href="\/accessibility\/"/);
      assert.match(html, /href="\/colophon\/"/);
    }

    assert.doesNotMatch(home, /placeholder copy, inky to write/);
    assert.doesNotMatch(home, /next-hello__move/);
    assert.match(home, /Hello friend, I(?:'|&#39;)m Stefan <span aria-hidden="true">👋🏽<\/span>\. I write software, play too much Deadlock, and I(?:'|&#39;)ll probably lose to you at chess\. Do you like any of that\? Let(?:'|&#39;)s be friends!/);
    assert.doesNotMatch(home, /Here(?:'|&#39;)s the latest/);
    assert.match(home, /Sample data/);
    assert.match(home, /Nov 22, 2026, 4:40 PM CT/);
    const boardHtml = home.match(/<section\b[^>]*\bid="crew-board"[\s\S]*?<\/section>/);
    assert.ok(boardHtml, 'preview home has no crew board');
    assert.doesNotMatch(boardHtml[0], /UTC/);
    assert.match(home, /<a href="\/">Everything else<\/a>/);
    assert.equal([...home.matchAll(/class="rasa-card rasa-card--/g)].length, 5);

    const card = postcardCard(home);
    assert.match(card, /check-ins post a day later/);
    assert.doesNotMatch(card, /<time\b|Last job|lastJob|\d{4}-\d{2}-\d{2}/);
    assert.equal([...home.matchAll(/data-crew-card="/g)].length, 5);

    assert.doesNotMatch(now, /placeholder copy, inky to write/);
    assert.doesNotMatch(now, /The move|Placeholder\./);
    for (const heading of ['Work', 'Learning', 'Running', 'Building', 'Playing']) {
      assert.match(now, new RegExp(`<h2\\b[^>]*>${heading}</h2>`));
    }
    assert.match(now, /Writing software for a living\./);
    assert.match(now, /Working through the Linux course on Boot\.dev\./);
    assert.match(now, /I ran my first 10K on Oct 31 in 58:30\./);
    assert.match(now, /This site, and the crew of bots that helps me run it\./);
    assert.match(now, /Deadlock\. I(?:'|&#39;)m also playing WoW Forever and Football Manager 2027, and rewatching Ted Lasso\./);
    assert.match(now, /href="\/next-2027\/now\/archive\/"/);

    const entries = readdirSync(path.join(ROOT, 'src/now-entries')).filter(name => name.endsWith('.md'));
    assert.equal([...archive.matchAll(/href="\/now\/#now-/g)].length, entries.length);
  });

  it('stays out of the sitemap, the feeds, and every live page', () => {
    for (const name of ['sitemap.xml', 'feed.xml', 'feed.json']) {
      const text = readFileSync(path.join(DIST, name), 'utf8');
      assert.equal(text.includes('next-2027'), false, `${name} lists the preview`);
    }

    const leaks = htmlFiles()
      .filter(file => !previewRoutes.includes(urlForFile(file)))
      .filter(file => readFileSync(file, 'utf8').includes('/next-2027/'))
      .map(urlForFile);
    assert.deepEqual(leaks, []);
  });

  it('keeps Chiang Mai and Thailand off every preview page', () => {
    const pages = htmlFiles().filter(file => urlForFile(file).startsWith('/next-2027/'));
    assert.ok(pages.length >= previewRoutes.length);
    const hits = pages
      .filter(file => /Chiang Mai|Thailand/.test(readFileSync(file, 'utf8')))
      .map(urlForFile);
    assert.deepEqual(hits, []);
  });

  it('shows a Lichess card and a hidden puzzle on the preview home only', () => {
    const home = readFileSync(fileForRoute('/next-2027/'), 'utf8');
    const now = readFileSync(fileForRoute('/next-2027/now/'), 'utf8');
    const chess = JSON.parse(readFileSync(path.join(ROOT, 'src/_data/next2027ChessSnapshot.json'), 'utf8'));
    const card = home.match(/<a\b[^>]*class="next-lichess"[^>]*>[\s\S]*?<\/a>/);
    assert.ok(card, 'preview home has no Lichess card');
    assert.match(card[0], /href="\/chess\/"/);
    assert.match(card[0], /Latest game on Lichess/);
    assert.ok(card[0].includes(chess.result), 'Lichess card has no result');
    assert.ok(card[0].includes(chess.white) && card[0].includes(chess.black));
    assert.equal([...card[0].matchAll(/class="chess-sq /g)].length, 64);

    const dialog = home.match(/<dialog\b[\s\S]*?<\/dialog>/);
    assert.ok(dialog, 'preview home has no puzzle dialog');
    assert.match(dialog[0], /role="dialog"/);
    assert.ok(dialog[0].includes(chess.puzzle.text), 'dialog is missing the text position');
    assert.match(dialog[0], new RegExp(`data-from="${chess.puzzle.from}"`));
    assert.match(dialog[0], new RegExp(`data-to="${chess.puzzle.to}"`));

    const knights = [...home.matchAll(/<button\b[^>]*>/g)].map(match => match[0]).filter(tag => tag.includes('data-puzzle-open'));
    assert.equal(knights.length, 2);
    for (const tag of knights) assert.match(tag, /aria-label="Open the puzzle"/);
    const knightRule = home.match(/(?:^|})(\.next-knight)\{([^}]+)\}/);
    assert.ok(knightRule, 'preview home is missing the knight button rule');
    for (const prop of ['width', 'height', 'min-width', 'min-height']) {
      assert.match(knightRule[2], new RegExp(`(?:^|;)${prop}:44px(?:;|$)`), `knight ${prop} is under 44px`);
    }
    const helloAt = home.indexOf('Hello friend');
    const firstKnight = home.indexOf('data-puzzle-open');
    const cardAt = home.indexOf('class="next-lichess"');
    assert.ok(helloAt > -1 && helloAt < firstKnight && firstKnight < cardAt, 'knight is not beside the hello');

    assert.match(home, /src="\/assets\/scripts\/components\/next-2027-puzzle\.js"/);
    const nowBody = now.slice(now.indexOf('<body'));
    assert.doesNotMatch(nowBody, /class="next-lichess"|data-puzzle-open|next-2027-puzzle\.js|<dialog\b/);
    const scriptPages = htmlFiles()
      .filter(file => readFileSync(file, 'utf8').includes('next-2027-puzzle.js'))
      .map(urlForFile);
    assert.deepEqual(scriptPages, ['/next-2027/']);
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
