# Eleventy Excellent — ingested reference

Canonical upstream docs (keep these bookmarks):

- [Style guide](https://eleventy-excellent.netlify.app/styleguide/)
- [Get started](https://eleventy-excellent.netlify.app/get-started/)

This file is a **distilled** summary for this repo. When in doubt, prefer design tokens and patterns from `src/_data/designTokens/` and existing global CSS over ad hoc values.

---

## Design tokens (style guide)

Tokens live in `src/_data/designTokens/`; generated custom properties land in `src/assets/css/global/base/variables.css`. The [style guide](https://eleventy-excellent.netlify.app/styleguide/) shows the full palette.

### Semantic / theme colors (often used in CSS)

- `--color-text`, `--color-text-accent`
- `--color-bg`, `--color-bg-accent`, `--color-bg-accent-2`
- `--color-primary`, `--color-secondary`, `--color-tertiary`

### Neutral scale (examples)

- `--color-gray-100` … `--color-gray-900`

### Accent palettes (examples)

- `--color-pink`, `--color-pink-subdued`
- `--color-blue`, `--color-blue-subdued`
- `--color-gold`, `--color-gold-subdued`

### Gradients

- `--gradient-rainbow`, `--gradient-conic`, `--gradient-stripes`

### Typography

- Display: `var(--font-display)` (Red Hat Display stack)
- Body: `var(--font-base)` (Atkinson Hyperlegible stack)
- Mono: `var(--font-mono)`

### Fluid type steps

- `--size-step-min-2` through `--size-step-6` (Utopia-based; see style guide for px ranges)

### Fluid spacing

- `--space-3xs` … `--space-3xl` and paired tokens like `--space-l-xl`, `--space-xl-2xl`

### Regenerating palette-driven colors (v4+)

After editing `src/_data/designTokens/colorsBase.json`, run `npm run colors` to regenerate `colors.json`. If you **rename** color keys, update `variables.css` accordingly; other CSS should reference the custom properties only.

---

## CSS architecture (Get started)

- **Methodology:** [CUBE CSS](https://cube.fyi/).
- **Global blocks:** `src/assets/css/global/blocks/*.css`.
- **Per-page / scoped CSS:** `src/assets/css/local/*.css`, included only where needed:

```njk
{% css "local" %}
  {% include "css/your-file.css" %}
{% endcss %}
```

- **Cascade layers:** Global bundle uses layers; **local bundle does not**, so local CSS wins without fighting selector specificity.
- **Production:** Main CSS is inlined (see `src/_includes/head/css-inline.njk`).
- **Component CSS** (copied to output): `src/assets/css/components/` → `/assets/css/components/`.
- **Tailwind:** Utilities exist but behavior differs from a typical Tailwind app; see the starter’s blog post linked from Get started.

---

## Eleventy config layout

Modular config under `src/_config/`:

- `collections.js`, `events.js`, `filters.js`, `plugins.js`, `shortcodes.js`

Register additions in `eleventy.config.js` from those modules.

---

## Content and site data

- Site-wide strings / options: `src/_data/meta.js`
- Person + socials: `src/_data/personal.yaml`
- Nav: `src/_data/navigation.js`
- External link domain allowlist styling: `src/assets/css/global/blocks/external-link.css` (replace starter domain with yours, or use `no-indicator` on links)

---

## Images

Eleventy Image: HTML transform, Markdown `![]()`, or Nunjucks `{% image %}` / `{% imageKeys %}`. Use `eleventy:ignore` on an `<img>` to skip optimization.

---

## SVG shortcode

```njk
{% svg "folder/name", "Accessible name or null", "class-names", "optional: inline style" %}
```

Paths are under `src/assets/svg/` (e.g. `divider/soft-bottom`). Default: `aria-hidden="true"` when no accessible name.

**Build note:** Prefer **CSS-controlled `fill`** (or a single path without fragile `var()` in attributes if your SVGO pipeline strips them) for dividers and complex shapes.

---

## Other features (pointers)

- **Cards:** `<custom-card>` WebC + slots (see Get started).
- **Masonry:** `<custom-masonry>` with optional `layout="50-50"`.
- **Theme:** `prefers-color-scheme` + footer toggle; preserve `aria-labelledby="theme-switcher-label"` if you change UI.
- **OG images:** `src/common/og-images.njk`, assets under `src/assets/og-images/`; `npm run clean:og` to reset generated images.
- **A11y tests:** `npm run test:a11y` (pa11y-ci; config from sitemap / `meta.js`).

---

## This fork

URLs and collections may differ from upstream examples (e.g. articles listing, permalinks). Follow **this repo’s** `src/pages/`, `src/posts/`, and `eleventy.config.js` when they conflict with generic starter docs.
