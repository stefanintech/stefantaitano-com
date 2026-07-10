# Friction Log — /links Page Audit

Audited: July 10, 2026 · Viewports tested: 320px, 390px (mobile emulation), desktop · Local dev build

Severity scale: **P0** = broken/hurts the primary job · **P1** = meaningful friction · **P2** = polish

---

## P0 — Buttons run edge-to-edge on mobile (no side gutters)

**What I saw:** At 390px, measured `profileLeft: 0` and `btnWidth: 390` — the buttons and avatar column touch the physical screen edges with zero horizontal padding.

**Why:** `.links-page` carries the `wrapper` class, but `links.css` sets `display: flex` on it. The site's `.wrapper` composition works by being `display: grid` with gutter columns (`--gap: clamp(1rem, 6vw, 3rem)`), so the flex override silently destroys the gutters and the `grid-column: content` placement of children.

**Fix direction:** Don't fight the wrapper. Put the flex/centering on an inner element and let `.wrapper` keep its grid, or drop `wrapper` and add explicit `padding-inline`.

---

## P1 — Avatar is lazy-loaded but it's the LCP element

**What I saw:** Built HTML has `loading="lazy"` on the avatar (added automatically by the image transform). The avatar is the first thing a QR scanner sees; lazy-loading the largest above-the-fold element delays LCP on hotel/conference Wi-Fi — exactly the network this page is designed for.

**Fix direction:** Mark the avatar `loading="eager"` / `fetchpriority="high"` (the image shortcode or transform usually supports an override), or inline it small.

## P1 — The easter-egg hint is unusable by the QR audience

**What I saw:** The visible hint says "type `stefan` for a surprise" — but the primary audience arrives by phone, where there is no keyboard. The touch egg (long-press avatar) has no hint at all, and dblclick doesn't exist on touch.

**Fix direction:** Make the hint input-aware (e.g. "press and hold the photo" on touch via a `@media (hover: none)` swap, keyboard wording on desktop), or drop the text hint and let the avatar subtly wiggle once to invite a tap.

## P1 — Easter egg spoils itself to screen readers, and the `figure` is a fake button

**What I saw:** The avatar `<figure>` has `tabindex="0"` and `aria-label="Stefan Taitano — double-click for a surprise"`. That announces the surprise to screen-reader users (spoiling it), exposes a focusable element with no real role, and traps Enter/Space on a non-button. Meanwhile the visible hint is `aria-hidden`, so SR users get the spoiler but not the hint — backwards.

**Fix direction:** Either make it a real `<button>` with an innocuous label ("Stefan Taitano"), or remove it from the tab order entirely and keep the egg pointer-only.

## P1 — Site chrome pushes content down on small screens

**What I saw:** At 320px the top nav wraps to two rows (6 items now that Links was added), so the avatar starts roughly a third of the way down the screen. A links page's job is instant recognition; every scanned visitor pays this cost.

**Fix direction:** Keep the header (brand trust is worth something) but tighten the page's top region spacing on small viewports, or use a minimal variant of the layout for this page.

## P1 — `target="_blank"` on every link

**What I saw:** All six external buttons force new tabs. On mobile browsers this stacks tabs the visitor didn't ask for, and back-button behavior becomes confusing. Link-in-bio convention is same-tab navigation — the page's whole job is to hand the visitor off.

**Fix direction:** Remove `target="_blank"`; keep `rel="me"` for identity URLs (Bluesky, GitHub, LinkedIn, Lichess) only — it's not meaningful on Website/Field Notes.

---

## P2 — Hint text fails contrast

Computed: accent gray at `opacity: 0.6` on the dark background lands around 3.4:1 — under the 4.5:1 AA threshold for small text. If the text is worth showing, it's worth reading; if it's decorative, hide it. Bump opacity/color or restructure per the P1 hint item.

## P2 — Flat button hierarchy

All seven buttons are identical primary amber. Nothing tells a RubyConf hallway visitor "start here." Consider making Website (or GitHub, given the audience) visually primary and demoting Email/Lichess to ghost buttons — same list, clearer path.

## P2 — Tagline will go stale after the conference

"…at RubyConf" is hardcoded in `links.yaml`. Fine for next week, guaranteed wrong the week after. Worth a reminder or a date-gated suffix.

## P2 — Footer duplicates four of the seven links

GitHub, LinkedIn, Bluesky, and Lichess icon buttons render again in the footer immediately below the button list on mobile. Not harmful, but it dilutes the single-column focus. Acceptable trade for keeping shared chrome — noting it for awareness.

## P2 — Tap target height is at the floor

Buttons measure ~46px tall — above the 44px minimum but below the ~48px comfortable target. One padding step up costs nothing on this page.

---

## What already works well (keep these)

- Owned URL on your domain, no third-party branding or tracking
- Correct semantic list inside `nav[aria-label]`; real links, no JS routing
- Brand-consistent: Fraunces display name, amber buttons, cream/charcoal theme, both color schemes work
- Data-driven via `links.yaml` resolving from `personal.yaml` — one place to update platform URLs
- Confetti keyword egg inherited site-wide; egg never blocks a primary CTA
- Avatar served through the image transform as optimized `<picture>`
