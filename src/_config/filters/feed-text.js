const escapeHtml = value =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

/** Escapes `value` and joins its words with non-breaking spaces, so "San Francisco" never wraps. Mark the result `safe`. */
export const nbsp = value => escapeHtml(value).trim().replace(/\s+/g, '&nbsp;');

const VOID_TAGS = new Set(['img', 'hr', 'br', 'source', 'input']);

/**
 * Splits rendered HTML after its first top-level block (a paragraph, list, figure, …).
 * Returns `{html, more}`, where `more` is true when anything followed that block.
 */
export const firstBlock = html => {
  const source = String(html ?? '').trim();
  const open = source.match(/^<([a-z][a-z0-9]*)\b[^>]*>/i);
  if (!open) return {html: source, more: false};

  const tag = open[1].toLowerCase();
  if (VOID_TAGS.has(tag)) {
    const end = open[0].length;
    return {html: source.slice(0, end), more: source.slice(end).trim().length > 0};
  }
  const tagPattern = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
  let depth = 0;
  for (const match of source.matchAll(tagPattern)) {
    depth += match[1] ? -1 : 1;
    if (depth === 0) {
      const end = match.index + match[0].length;
      return {html: source.slice(0, end), more: source.slice(end).trim().length > 0};
    }
  }
  return {html: source, more: false};
};
