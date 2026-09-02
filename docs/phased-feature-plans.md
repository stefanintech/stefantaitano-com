# Phased feature plans

Use this when a change is too big to land in one sitting: a new page, a new API, or work that touches several templates. Chess is the worked example — `docs/chess-project-plan.md` — and it is the shape to copy.

Skip this for small work. A copy tweak, a one-line CSS fix, a study chapter paste, or a bug in something already shipped does not need a plan.

## How we work

1. **Plan first.** In the conversation, agree the outcome, what not to build, and which existing files to extend. Then write `docs/<feature>-project-plan.md` before the first implementation commit.
2. **One visible slice per phase.** A visitor should be able to see or use something when that phase lands. Data-only work is fine as Phase 0 if a later page depends on it, as long as it fails soft and does not break what is already live.
3. **One phase per session.** Commit at the end. Do not start the next phase unless Stefan says “next phase” (or equivalent).
4. **Fit this repo.** Input is `src/`, data is `src/_data/`, pages are `src/pages/`, includes are `src/_includes/`, output is `dist/`. Prefer tokens, layouts, CSS bundles, and the SVG OG pipeline that already exist. Do not invent a parallel `_data/` or `_site/`.
5. **Verify before you parse.** If a phase talks to an external API, curl the real response first. Write the parser against what you saw, not an assumed schema. Do not invent endpoints.
6. **Name “done when.”** Each phase says what “shipped” looks like, plus the gotchas that will waste an hour if skipped.

## What each plan should contain

- One sentence for the outcome, and a **Cut** list of things we are not building.
- A table of **files already in this repo** that the work should extend, not replace.
- Standing rules for the agent (endpoints, fail-soft, copy, layout).
- Numbered phases in order. Each phase: **Build**, **Endpoints** (if any), **Verify first**, **Gotchas**, **Done when**.
- Which phases are shippable on their own, and which are stretch.

Copy voice from `docs/site-voice.md`. Direct sentences, specific details, no slogans.

## After it ships

Leave the plan in `docs/`. Add a short **Status** at the top so a later conversation can see what landed without rereading the whole file.
