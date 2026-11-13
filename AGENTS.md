# Agent notes for this site

This is Stefan Taitano’s Eleventy site. Read these before changing code.

- **Phased features:** `.cursor/rules/phased-features.mdc` and `docs/phased-feature-plans.md`. For a big new page or integration, plan phases with Stefan first. Chess is the reference: `docs/chess-project-plan.md`.
- **Layout and CSS:** `.cursor/rules/eleventy-excellent.mdc` and `docs/eleventy-excellent-reference.md`. One layout (`src/_layouts/rasa*.njk`, behind the `base`/`page`/`post` aliases) and plain CSS in `src/assets/css/rasa/`, inlined through `{% css "rasa" %}`. No Tailwind or token pipeline. The history is in `docs/tabula-rasa-project-plan.md`.
- **Chess page:** `.cursor/rules/chess-page.mdc` (Lichess endpoints, study-embed procedure).
- **Copy:** `docs/site-voice.md`.
- **Check-ins:** `.cursor/rules/checkins.mdc`, `docs/checkins-project-plan.md`, and the city map in `docs/checkins-map-project-plan.md`. A check-in goes live on the merge to `main`, which happens after `publishAfter`. There is no scheduled rebuild. Home-area exclusions stay in `CHECKIN_MAP_EXCLUDE` only.
- **Pre-merge review:** Before Stefan is asked for a merge OK, a PR that touches code, layout, CSS, templates, tests, or build config gets a review pass from a cloud agent in the `review` mode (`.cursor/skills/review/SKILL.md`) that posts its findings on the PR. Run that pass once, on the final head commit, and state that SHA. If the head changes after the review, re-review only that head. Stefan is pinged only once the review is CLEAN or its findings are fixed, and merges still need his explicit OK. Plain check-ins stay the exception. The longer form is `docs/site-loop-project-plan.md`.
- **Settle content first:** Collect all copy (from inky), alt text (from Imogen), and any open fact questions for Stefan, and lock them into one list before the PR's build starts. Don't open the PR with placeholders and patch it later.
- **Design first:** Any PR that changes visible layout, CSS, or UI starts with a mockup or screenshot of the target look, and Stefan OKs it before the build begins, the same way copy gets settled first. Plain copy, alt text, data, and check-ins are exempt.
- **Scaled review:** Copy-only, alt-text-only, or data-only PRs (no code, layout, CSS, templates, tests, or config logic) skip the separate review agent. The builder self-checks the actual deploy preview, then runs tests, the build, and `npm run checkins:images -- --check`, and posts that proof with screenshots in the PR.
- **Security review:** Any PR that touches code, forms, scripts, third-party embeds, redirects, headers, or build/deploy config gets a defensive security pass as part of the existing single review on the final head. It checks for exposed secrets (including the env var names `CHECKIN_REBUILD_HOOK_URL` and `CHECKIN_MAP_EXCLUDE`, by name only; never print or commit their values), unsafe embeds or scripts, location or privacy leaks (check-in coordinates and EXIF), dependency risks, and missing security headers. Findings go in the PR. It is defensive only and adds no extra review round.
- **Preview:** Final verification always looks at the real Netlify deploy preview, not just the diff.

Small fixes (copy, one CSS rule, a study chapter paste) do not need a new plan. Do not invent a parallel layout. Input is `src/`, output is `dist/`.
