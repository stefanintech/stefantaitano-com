/**
 * Alt text on rendered <img> tags.
 *
 * An image fails when the alt attribute is missing, or when the alt is empty
 * (or only whitespace) and the image is not explicitly decorative.
 *
 * Empty alt is decorative when any of these is true:
 * - the img has role="presentation" or role="none"
 * - the img, or an ancestor, has aria-hidden="true" (any value other than "false")
 * - the img, or an ancestor, has role="presentation" or role="none"
 * - the img is inside a button or link that has its own accessible name
 *   (aria-label or aria-labelledby). That is the links-page avatar: alt=""
 *   on the photo, aria-label="Stefan Taitano" on the button
 *   (src/pages/links.njk, docs/links-page-friction-log.md).
 *
 * A missing alt attribute fails even when one of those marks is present.
 * Script, style, and comment text are not rendered, so they are skipped.
 */

const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr'
]);

const TAG = /<\/?([a-zA-Z][\w:-]*)\b([^>]*)>/g;
const ATTR = /([^\s"'=<>`/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

const stripUnrendered = html =>
  html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');

const parseAttrs = raw => {
  const attrs = new Map();
  ATTR.lastIndex = 0;
  for (const match of raw.matchAll(ATTR)) {
    const name = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    attrs.set(name, value);
  }
  return attrs;
};

const isHidden = attrs => {
  const value = attrs.get('aria-hidden');
  return value !== undefined && value.toLowerCase() !== 'false';
};

const isPresentational = attrs => {
  const role = (attrs.get('role') || '').toLowerCase();
  return role === 'presentation' || role === 'none';
};

const hasAccessibleName = attrs => {
  const label = attrs.get('aria-label');
  const labelledBy = attrs.get('aria-labelledby');
  return Boolean((label && label.trim()) || (labelledBy && labelledBy.trim()));
};

/** Empty alt is allowed only with an explicit decorative mark. */
const emptyAltIsDecorative = (attrs, ancestors) => {
  if (isPresentational(attrs) || isHidden(attrs)) return true;
  if (ancestors.some(ancestor => isHidden(ancestor.attrs) || isPresentational(ancestor.attrs))) return true;
  return ancestors.some(
    ancestor => (ancestor.name === 'button' || ancestor.name === 'a') && hasAccessibleName(ancestor.attrs)
  );
};

/**
 * @param {string} html
 * @returns {{src: string, reason: string}[]}
 */
export const imagesIn = html => {
  const problems = [];
  /** @type {{name: string, attrs: Map<string, string>}[]} */
  const ancestors = [];

  TAG.lastIndex = 0;
  for (const match of stripUnrendered(html).matchAll(TAG)) {
    const raw = match[0];
    const name = match[1].toLowerCase();
    if (raw.startsWith('</')) {
      for (let index = ancestors.length - 1; index >= 0; index -= 1) {
        const popped = ancestors.pop();
        if (popped.name === name) break;
      }
      continue;
    }

    const attrs = parseAttrs(match[2]);
    if (name === 'img') {
      const src = attrs.get('src') || '(no src)';
      if (!attrs.has('alt')) problems.push({src, reason: 'missing alt'});
      else if (attrs.get('alt').trim() === '' && !emptyAltIsDecorative(attrs, ancestors)) {
        problems.push({src, reason: 'empty alt is not decorative'});
      }
    }

    const selfClosing = /\/>$/.test(raw) || VOID_TAGS.has(name);
    if (!selfClosing) ancestors.push({name, attrs});
  }

  return problems;
};

/**
 * @param {{page: string, html: string}[]} pages
 * @returns {{page: string, src: string, reason: string}[]}
 */
export const altProblems = pages =>
  pages.flatMap(page => imagesIn(page.html).map(problem => ({page: page.page, ...problem})));

/**
 * @param {{page: string, src: string, reason: string}[]} problems
 */
export const formatAltProblems = problems => {
  const noun = problems.length === 1 ? 'image' : 'images';
  const lines = problems.map(problem => `  ${problem.page}: ${problem.src} (${problem.reason})`);
  return `[alt-text] ${problems.length} ${noun} with a missing alt, or an empty alt that is not decorative:\n${lines.join('\n')}`;
};

/**
 * @param {{page: string, html: string}[]} pages
 */
export const assertAltText = pages => {
  const problems = altProblems(pages);
  if (problems.length) throw new Error(formatAltProblems(problems));
};
