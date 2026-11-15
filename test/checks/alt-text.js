/**
 * Alt text on rendered <img> tags.
 *
 * An image fails when the alt attribute is missing, or when the alt is empty
 * (or only whitespace, after decoding character references) and the image is
 * not explicitly decorative.
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
 *
 * Optional end tags follow the HTML parser far enough to drop a hidden
 * ancestor that a browser would already have closed: a new li, dt/dd,
 * option, tr, or td/th closes the open one of that kind, and a block
 * start closes an open p. A ">" inside a quoted attribute stays in the tag.
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
const TAG_NAME = /^<\/?([a-zA-Z][\w:-]*)/;

/** Not special. An implied close can pop these on the way to its target. */
const PHRASING = new Set([
  'a',
  'abbr',
  'b',
  'bdi',
  'bdo',
  'cite',
  'code',
  'data',
  'dfn',
  'em',
  'i',
  'kbd',
  'label',
  'mark',
  'picture',
  'q',
  's',
  'samp',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'time',
  'u',
  'var'
]);

/**
 * A start tag of one of these closes an open p, as in the HTML parser.
 * li, dt, and dd do too: their insertion steps close a p in button scope.
 */
const CLOSES_P = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'dd',
  'details',
  'dialog',
  'div',
  'dl',
  'dt',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hgroup',
  'hr',
  'li',
  'main',
  'menu',
  'nav',
  'ol',
  'p',
  'pre',
  'search',
  'section',
  'table',
  'ul'
]);

/** Elements an end tag will not pop through when its own name is not open. */
const SPECIAL = new Set([
  ...CLOSES_P,
  'button',
  'caption',
  'option',
  'select',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr'
]);

const SAME_KIND = new Map([
  ['li', new Set(['li'])],
  ['dt', new Set(['dt', 'dd'])],
  ['dd', new Set(['dt', 'dd'])],
  ['option', new Set(['option'])],
  ['tr', new Set(['tr'])],
  ['td', new Set(['td', 'th'])],
  ['th', new Set(['td', 'th'])]
]);

/** Ancestors the walk may pass while looking for the element a start tag closes. */
const PASS_THROUGH = new Map([
  ['li', new Set([...PHRASING, 'address', 'div', 'p'])],
  ['dt', new Set([...PHRASING, 'address', 'div', 'p'])],
  ['dd', new Set([...PHRASING, 'address', 'div', 'p'])],
  ['option', new Set()],
  ['tr', new Set([...PHRASING, 'td', 'th'])],
  ['td', new Set(PHRASING)],
  ['th', new Set(PHRASING)]
]);

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

const characterFromCode = code => {
  if (!Number.isInteger(code) || code < 0 || code > 0x10ffff) return '';
  if (code === 0 || (code >= 0xd800 && code <= 0xdfff)) return '\uFFFD';
  return String.fromCodePoint(code);
};

/** Decode the character references that show up in alt text and element text. */
const decodeText = value =>
  value
    .replace(/&#(\d+);/g, (_, digits) => characterFromCode(Number(digits)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => characterFromCode(Number.parseInt(hex, 16)))
    .replace(/&nbsp;/gi, ' ')
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

const popThrough = (ancestors, idText, index) => {
  while (ancestors.length > index) recordId(ancestors.pop(), idText);
};

/**
 * Index of the element this start tag closes, or -1. The walk stops at an
 * element it is not allowed to pass, so a later li does not close an li
 * that a ul or a button sits between.
 * @param {{name: string}[]} ancestors
 * @param {Set<string>} match
 * @param {Set<string>} pass
 */
const impliedIndex = (ancestors, match, pass) => {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const {name} = ancestors[index];
    if (match.has(name)) return index;
    if (!pass.has(name)) return -1;
  }
  return -1;
};

/**
 * Pop the open element HTML would close before inserting this start tag.
 * @param {{name: string, attrs: Map<string, string>, text: string}[]} ancestors
 * @param {Map<string, string>} idText
 * @param {string} startName
 */
const popImplied = (ancestors, idText, startName) => {
  if (CLOSES_P.has(startName)) {
    const index = impliedIndex(ancestors, new Set(['p']), PHRASING);
    if (index !== -1) popThrough(ancestors, idText, index);
  }

  const same = SAME_KIND.get(startName);
  if (!same) return;
  const index = impliedIndex(ancestors, same, PASS_THROUGH.get(startName));
  if (index !== -1) popThrough(ancestors, idText, index);
};

/**
 * An end tag pops through its matching open element. If a special element
 * is in the way, the tag is ignored, which is what a browser does with a
 * closer whose element an implied end tag already removed.
 * @param {{name: string, attrs: Map<string, string>, text: string}[]} ancestors
 * @param {Map<string, string>} idText
 * @param {string} name
 */
const popEndTag = (ancestors, idText, name) => {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    if (ancestors[index].name === name) {
      popThrough(ancestors, idText, index);
      return;
    }
    if (SPECIAL.has(ancestors[index].name)) return;
  }
};

/** Index just past the tag's ">", or -1. Quoted attribute values may contain ">". */
const tagEnd = (html, start) => {
  let quote = '';
  for (let index = start + 1; index < html.length; index += 1) {
    const char = html[index];
    if (quote) {
      if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '>') return index + 1;
  }
  return -1;
};

/**
 * @param {string} html
 * @returns {{text?: string, raw?: string, name?: string, attrs?: string, closing?: boolean}[]}
 */
const tokenize = html => {
  /** @type {{text?: string, raw?: string, name?: string, attrs?: string, closing?: boolean}[]} */
  const tokens = [];
  let cursor = 0;
  while (cursor < html.length) {
    const start = html.indexOf('<', cursor);
    if (start === -1) {
      tokens.push({text: html.slice(cursor)});
      break;
    }
    if (start > cursor) tokens.push({text: html.slice(cursor, start)});

    const end = tagEnd(html, start);
    if (end === -1) {
      tokens.push({text: html.slice(start)});
      break;
    }

    const raw = html.slice(start, end);
    const match = TAG_NAME.exec(raw);
    if (!match) tokens.push({text: raw});
    else {
      let attrs = raw.slice(match[0].length, -1);
      if (attrs.endsWith('/')) attrs = attrs.slice(0, -1);
      tokens.push({raw, name: match[1].toLowerCase(), attrs, closing: raw.startsWith('</')});
    }
    cursor = end;
  }
  return tokens;
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

  for (const token of tokenize(stripUnrendered(html))) {
    if (!token.name) {
      for (const ancestor of ancestors) ancestor.text += token.text;
      continue;
    }

    if (token.closing) {
      popEndTag(ancestors, idText, token.name);
      continue;
    }

    popImplied(ancestors, idText, token.name);

    const attrs = parseAttrs(token.attrs);
    if (token.name === 'img') {
      const alt = attrs.get('alt');
      images.push({
        src: attrs.get('src') || '(no src)',
        missing: !attrs.has('alt'),
        empty: attrs.has('alt') && decodeText(alt) === '',
        attrs,
        ancestors: ancestors.map(ancestor => ({name: ancestor.name, attrs: ancestor.attrs}))
      });
    }

    const selfClosing = token.raw.endsWith('/>') || VOID_TAGS.has(token.name);
    if (!selfClosing) ancestors.push({name: token.name, attrs, text: ''});
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
