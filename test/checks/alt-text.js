/**
 * Alt text on rendered <img> tags.
 *
 * An image fails when the alt attribute is missing, or when the alt is empty
 * (or only whitespace) and the image is not explicitly decorative.
 *
 * Empty alt is decorative when any of these is true:
 * - the img itself has role="presentation" or role="none". A parent role does
 *   not count; presentational roles are not inherited by a descendant img.
 * - the img, or an ancestor, has aria-hidden="true" (trimmed, any case).
 *   An empty or bare aria-hidden does not count.
 * - the closest interactive ancestor (a, button, input, select, textarea)
 *   is a button with a non-empty aria-label, or an aria-labelledby whose
 *   ids all exist and whose combined text is non-empty. A link does not
 *   qualify. That is the links-page avatar: alt="" on the photo,
 *   aria-label="Stefan Taitano" on the button (src/pages/links.njk).
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

const INTERACTIVE = new Set(['a', 'button', 'input', 'select', 'textarea']);

const ATTR = /([^\s"'=<>`/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
const TOKEN = /<\/?([a-zA-Z][\w:-]*)\b([^>]*)>|[^<]+/g;

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

const decodeText = value =>
  value
    .replace(/&nbsp;|&#160;|&#x0*a0;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();

/** Only the literal true state hides the image. "" and a bare attribute do not. */
const isHidden = attrs => (attrs.get('aria-hidden') ?? '').trim().toLowerCase() === 'true';

/** Presentational role is read on the img only. It is not inherited. */
const isPresentational = attrs => {
  const role = (attrs.get('role') ?? '').trim().toLowerCase();
  return role === 'presentation' || role === 'none';
};

/**
 * @param {Map<string, string>} attrs
 * @param {Map<string, string>} idText
 */
const buttonHasName = (attrs, idText) => {
  const label = attrs.get('aria-label');
  if (label && label.trim()) return true;

  const labelledBy = attrs.get('aria-labelledby');
  if (!labelledBy || !labelledBy.trim()) return false;

  const parts = [];
  for (const id of labelledBy.trim().split(/\s+/)) {
    if (!idText.has(id)) return false;
    parts.push(idText.get(id));
  }
  return parts.join(' ').trim() !== '';
};

/**
 * The nearest interactive ancestor must be the button. A link closer in,
 * even inside a named button, does not qualify.
 * @param {{name: string, attrs: Map<string, string>}[]} ancestors
 * @param {Map<string, string>} idText
 */
const namedButtonOwnsImage = (ancestors, idText) => {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (!INTERACTIVE.has(ancestor.name)) continue;
    if (ancestor.name !== 'button') return false;
    return buttonHasName(ancestor.attrs, idText);
  }
  return false;
};

/** Empty alt is allowed only with an explicit decorative mark. */
const emptyAltIsDecorative = (attrs, ancestors, idText) => {
  if (isPresentational(attrs) || isHidden(attrs)) return true;
  if (ancestors.some(ancestor => isHidden(ancestor.attrs))) return true;
  return namedButtonOwnsImage(ancestors, idText);
};

const recordId = (element, idText) => {
  const id = element.attrs.get('id');
  if (!id || idText.has(id)) return;
  idText.set(id, decodeText(element.text));
};

/**
 * @param {string} html
 * @returns {{src: string, reason: string}[]}
 */
export const imagesIn = html => {
  /** @type {{name: string, attrs: Map<string, string>, text: string}[]} */
  const ancestors = [];
  /** @type {{src: string, missing: boolean, empty: boolean, attrs: Map<string, string>, ancestors: {name: string, attrs: Map<string, string>}[]}[]} */
  const images = [];
  /** @type {Map<string, string>} */
  const idText = new Map();

  TOKEN.lastIndex = 0;
  for (const match of stripUnrendered(html).matchAll(TOKEN)) {
    if (!match[1]) {
      for (const ancestor of ancestors) ancestor.text += match[0];
      continue;
    }

    const raw = match[0];
    const name = match[1].toLowerCase();
    if (raw.startsWith('</')) {
      for (let index = ancestors.length - 1; index >= 0; index -= 1) {
        const popped = ancestors.pop();
        recordId(popped, idText);
        if (popped.name === name) break;
      }
      continue;
    }

    const attrs = parseAttrs(match[2]);
    if (name === 'img') {
      const alt = attrs.get('alt');
      images.push({
        src: attrs.get('src') || '(no src)',
        missing: !attrs.has('alt'),
        empty: attrs.has('alt') && alt.trim() === '',
        attrs,
        ancestors: ancestors.map(ancestor => ({name: ancestor.name, attrs: ancestor.attrs}))
      });
    }

    const selfClosing = /\/>$/.test(raw) || VOID_TAGS.has(name);
    if (!selfClosing) ancestors.push({name, attrs, text: ''});
  }

  while (ancestors.length) recordId(ancestors.pop(), idText);

  const problems = [];
  for (const image of images) {
    if (image.missing) problems.push({src: image.src, reason: 'missing alt'});
    else if (image.empty && !emptyAltIsDecorative(image.attrs, image.ancestors, idText)) {
      problems.push({src: image.src, reason: 'empty alt is not decorative'});
    }
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
