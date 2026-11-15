/**
 * Alt text on rendered <img> tags.
 *
 * The page is parsed with parse5 (scripting off, so noscript is HTML), so the
 * tree matches a browser: implied end tags, character references (with or
 * without a semicolon), duplicate attributes (the first wins), and quotes
 * only where the HTML tokenizer starts them. Images the parser never creates,
 * including ones written inside script, style, textarea, title, or select,
 * are not checked. Template contents are checked, because this site renders
 * them (is-land and declarative shadow roots). The template stays in the
 * ancestor chain, so aria-hidden on the island or a host still counts.
 *
 * An img, or an input type="image", fails when its alt attribute is missing,
 * or when the alt is empty (or only whitespace) and it is not explicitly
 * decorative.
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
 */

import {parse} from 'parse5';

const HTML_NS = 'http://www.w3.org/1999/xhtml';
const INTERACTIVE = new Set(['a', 'button', 'input', 'select', 'textarea']);

/**
 * @param {{attrs?: {name: string, value: string}[]}} element
 * @param {string} name
 */
const attr = (element, name) => element.attrs?.find(attribute => attribute.name === name)?.value;

/** Only the literal true state hides the image. "" and a bare attribute do not. */
const isHidden = element => (attr(element, 'aria-hidden') ?? '').trim().toLowerCase() === 'true';

/** Presentational role is read on the img only. It is not inherited. */
const isPresentational = element => {
  const role = (attr(element, 'role') ?? '').trim().toLowerCase();
  return role === 'presentation' || role === 'none';
};

/**
 * @param {{childNodes?: {nodeName: string, value?: string, tagName?: string, childNodes?: unknown[]}[]}} node
 */
const textOf = node => {
  let text = '';
  const visit = current => {
    for (const child of current.childNodes ?? []) {
      if (child.nodeName === '#text') text += child.value ?? '';
      else if (child.tagName !== 'template') visit(child);
    }
  };
  visit(node);
  return text.replace(/\s+/g, ' ').trim();
};

/**
 * Template contents live on a document fragment, not under the template.
 * The fragment's host is the template, so ancestor walks can keep going.
 * @type {WeakMap<object, {tagName?: string, parentNode?: unknown}>}
 */
const templateHosts = new WeakMap();

/**
 * @param {{tagName?: string, parentNode?: {tagName?: string, parentNode?: unknown}|null}} element
 */
const ancestorElements = element => {
  /** @type {{tagName: string, attrs?: {name: string, value: string}[]}[]} */
  const ancestors = [];
  const seen = new Set();
  let parent = element.parentNode;
  while (parent && !seen.has(parent)) {
    seen.add(parent);
    if (parent.tagName) ancestors.push(parent);
    parent = parent.parentNode ?? templateHosts.get(parent);
  }
  return ancestors;
};

/**
 * @param {{attrs?: {name: string, value: string}[]}} element
 * @param {Map<string, string>} idText
 */
const buttonHasName = (element, idText) => {
  const label = attr(element, 'aria-label');
  if (label && label.trim()) return true;

  const labelledBy = attr(element, 'aria-labelledby');
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
 * @param {{tagName?: string, parentNode?: unknown}} element
 * @param {Map<string, string>} idText
 */
const namedButtonOwnsImage = (element, idText) => {
  for (const ancestor of ancestorElements(element)) {
    if (!INTERACTIVE.has(ancestor.tagName)) continue;
    if (ancestor.tagName !== 'button') return false;
    return buttonHasName(ancestor, idText);
  }
  return false;
};

/** Empty alt is allowed only with an explicit decorative mark. */
const emptyAltIsDecorative = (element, idText) => {
  if (isPresentational(element) || isHidden(element)) return true;
  if (ancestorElements(element).some(ancestor => isHidden(ancestor))) return true;
  return namedButtonOwnsImage(element, idText);
};

/** An img, or an input whose type is image (any case, trimmed). */
const isImageControl = element =>
  element.tagName === 'img' ||
  (element.tagName === 'input' && (attr(element, 'type') ?? '').trim().toLowerCase() === 'image');

/**
 * @param {{childNodes?: {tagName?: string, namespaceURI?: string, content?: {childNodes?: unknown[]}, childNodes?: unknown[]}[]}} node
 * @param {(element: {tagName: string, attrs: {name: string, value: string}[]}) => void} visit
 */
const walk = (node, visit) => {
  for (const child of node.childNodes ?? []) {
    if (child.tagName && child.namespaceURI === HTML_NS) visit(child);
    if (child.tagName === 'template' && child.content) {
      templateHosts.set(child.content, child);
      walk(child.content, visit);
      continue;
    }
    if (child.childNodes) walk(child, visit);
  }
};

/**
 * @param {string} html
 * @returns {{src: string, reason: string}[]}
 */
export const imagesIn = html => {
  const document = parse(html, {scriptingEnabled: false});
  /** @type {Map<string, string>} */
  const idText = new Map();
  /** @type {{tagName: string, attrs: {name: string, value: string}[]}[]} */
  const images = [];

  walk(document, element => {
    const id = attr(element, 'id');
    if (id && !idText.has(id)) idText.set(id, textOf(element));
    if (isImageControl(element)) images.push(element);
  });

  const problems = [];
  for (const image of images) {
    const alt = attr(image, 'alt');
    const src = attr(image, 'src') || '(no src)';
    if (alt === undefined) problems.push({src, reason: 'missing alt'});
    else if (alt.trim() === '' && !emptyAltIsDecorative(image, idText)) {
      problems.push({src, reason: 'empty alt is not decorative'});
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
