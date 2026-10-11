# Agent notes for this site

This is Stefan Taitano’s Eleventy site. Read these before changing code.

- **Phased features:** `.cursor/rules/phased-features.mdc` and `docs/phased-feature-plans.md`. For a big new page or integration, plan phases with Stefan first. Chess is the reference: `docs/chess-project-plan.md`.
- **Layout and CSS:** `.cursor/rules/eleventy-excellent.mdc` and `docs/eleventy-excellent-reference.md`. One layout (`src/_layouts/rasa*.njk`, behind the `base`/`page`/`post` aliases) and plain CSS in `src/assets/css/rasa/`, inlined through `{% css "rasa" %}`. No Tailwind or token pipeline. The history is in `docs/tabula-rasa-project-plan.md`.
- **Chess page:** `.cursor/rules/chess-page.mdc` (Lichess endpoints, study-embed procedure).
- **Copy:** `docs/site-voice.md`.
- **Check-ins:** `.cursor/rules/checkins.mdc`, `docs/checkins-project-plan.md`, and the city map in `docs/checkins-map-project-plan.md`. A check-in goes live on the merge to `main`, which happens after `publishAfter`. There is no scheduled rebuild. Home-area exclusions stay in `CHECKIN_MAP_EXCLUDE` only.

Small fixes (copy, one CSS rule, a study chapter paste) do not need a new plan. Do not invent a parallel layout. Input is `src/`, output is `dist/`.
