# Friction Log — /links Page

First audited: July 10, 2026 · Re-audited: August 20, 2026 · Viewports: 320px, 390px, desktop

Severity scale: **P0** = broken/hurts the primary job · **P1** = meaningful friction · **P2** = polish

---

## Re-audit (20 Aug 2026)

The July P0/P1 list is largely done. At 390px the photo and buttons sit in the wrapper gutters (~11px each side), the compact header is a single Home row, the photo is a real button with `loading="eager"`, and the link buttons do not use `target="_blank"`.

Still worth doing for a Commit Your Code scan (this pass):

- **P2 — Footer duplicated the button list.** Platform icon buttons (GitHub, LinkedIn, Bluesky, Medium, Lichess) plus RSS rendered again under the CTA column. Hidden on the compact-header layout.
- **P1 — Hint assumed a keyboard.** The old query (`hover: none` and `pointer: coarse`) still showed “type `stefan`” in desktop device mode. Default is now “press and hold the photo”; keyboard wording only for fine pointers with hover.
- **P2 — Tagline would go stale after the event.** `eventUntil: 2026-09-05` drops the Commit Your Code suffix on the next build after that date.
- **P2 — Easter-egg toast opened a new tab.** Lichess link is same-tab, with `rel="me"`.

Left as-is, on purpose:

- Three primary buttons (GitHub, Résumé, Talk) and ghost for the rest. Clear enough for a hallway scan; not flattening to one “start here.”
- Footer still has Bookshelf / Field Notes / legal. Those are site chrome, not the same as the platform CTAs.
- No analytics.

---

## July 10 findings (status)

### P0 — Buttons run edge-to-edge on mobile — **Fixed**

`.links-page` no longer sets `display: flex` on `.wrapper`. Flex/centering lives on `.links-profile`, so gutter columns stay.

### P1 — Avatar is lazy-loaded but it's the LCP element — **Fixed**

Source `img` is `loading="eager"` / `fetchpriority="high"`. The image transform keeps those attributes.

### P1 — The easter-egg hint is unusable by the QR audience — **Fixed (this pass)**

Touch wording is the default. See re-audit.

### P1 — Easter egg spoils itself to screen readers, and the `figure` is a fake button — **Fixed**

The photo is a `<button type="button" aria-label="Stefan Taitano">` with a decorative `alt=""`. Enter/Space still fire the egg. Hint variants use `display: none` so only one is in the accessibility tree.

### P1 — Site chrome pushes content down on small screens — **Fixed**

`compactHeader` is Home + theme, not the six-item nav.

### P1 — `target="_blank"` on every link — **Fixed**

CTA buttons are same-tab. `rel="me"` stays on identity URLs. Toast matched in this pass.

### P2 — Hint text fails contrast — **Fixed**

Hint uses `--color-text-accent` at full opacity, not 0.6 on a dark band.

### P2 — Flat button hierarchy — **Fixed enough**

GitHub, Résumé, and the talk are primary. The rest are ghost.

### P2 — Tagline will go stale after the conference — **Fixed (this pass)**

Date-gated with `eventUntil`.

### P2 — Footer duplicates four of the seven links — **Fixed (this pass)**

Platform cluster omitted when `compactHeader` is set.

### P2 — Tap target height is at the floor — **Fixed**

`.links-button` is `min-block-size: 3.125rem` (~50px) with `--space-s` block padding.

---

## What already works well (keep these)

- Owned URL on your domain, no third-party branding or tracking
- Compact header for instant recognition on a scan
- Real `<button>` photo; egg never blocks a primary CTA
- Data-driven via `links.yaml` resolving from `personal.yaml`
- Avatar served through the image transform as optimized `<picture>`
- Brand-consistent: Fraunces name, amber primaries, cream/charcoal, both color schemes
