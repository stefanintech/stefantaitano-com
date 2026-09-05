# Design review, September 2026

**Status:** brainstorm only. Nothing here is for production. The mockups live at `/design-lab/` on the
`cursor/design-lab-mockups-29f5` branch and run with `npm start`. If a direction is picked, the next step is a
phased plan (`docs/redesign-project-plan.md`, per `docs/phased-feature-plans.md`), then one phase per session.

**The brief.** Minimal, simple, to the point, unique, cool. Four kinds of first-time visitor: a recruiter, a
developer, someone curious about chess, someone who just wants to know a little more about Stefan.

**Method.** Every page was rendered from the dev server at 1440px and 390px, light and dark, and read as a
stranger would. Notes below are UX/UI only. No copy, content, or data changes are proposed here.

---

## 1. What the site does well already

Keep these. They are the parts that are already unique.

- **The pixel night scene.** The knight constellation, the runner, the campfire, the plane. Nobody else has this.
  It is hand-drawn, it reacts, it tells the story (chess, running, travel) without a word.
- **The palette.** Cream, ink, amber, gold. Warm and consistent across light and dark.
- **The headline.** "I build systems for a living and escape plans for fun." One sentence, says who he is.
- **Live data.** Lichess status in the header, a real rating on the page, "I don't type them in." That is a
  genuinely cool trust signal and most personal sites cannot do it.
- **The voice.** Short, first-person, specific. The design should get out of its way.
- **The basics are right.** Accessible fonts, skip link, focus states, reduced-motion respected, dark mode,
  no tracking, fast.

---

## 2. Site-wide problems

These show up on every page, so fixing them once fixes the site.

### 2.1 Everything is loud

Body text is 19 to 28px. Every `h2` is 40 to 68px, the same Fraunces 900 as the `h1`. On `/chess/` six `h2`s
stack down the page, each nearly as big as the title, so the page reads as six billboards with small print
under each. The labels are bigger than the things they label.

*Fix:* one display-size heading per page. Section headings become small uppercase labels (13 to 16px, tracked,
muted). Body drops to 16 to 22px. Fraunces gets one job per page: the headline, or the big number.

### 2.2 Three voices competing

Fraunces 900, Caveat handwriting, Atkinson body, plus amber kickers, plus gold buttons, plus slate. The
homepage uses all of them above the fold. Handwriting appears on five pages as a section kicker, so it stops
reading as a personal aside and starts reading as a template feature.

*Fix:* Atkinson for almost everything. Fraunces for the one headline. Caveat at most once per page, in a place
that is actually an aside (the caption under the pixel scene, for example).

### 2.3 Boxes

Articles, projects, and bookshelf all use bordered or filled cards. Cards are the default look of every
starter. They also make short content look padded: a three-line book note in a box with a 4px border.

*Fix:* hairlines and whitespace. A 1px rule and a row of type is quieter, scans faster, and is harder to
mistake for a template.

### 2.4 The column

The wrapper is 85rem. At 1440px the content sits left with a wide empty right side, and the long-form pages
(`/now/`, `/resume/`) center a narrower column, so the site does not commit to one shape.

*Fix:* one 66rem column, centered, everywhere. Full-bleed only for the pixel scene.

### 2.5 Navigation does not match what visitors want

Top nav is Now, Articles, Talks, Projects. The two most-asked-for things are not there: the résumé (a recruiter
has to find a ghost button on the homepage) and chess (the most unique page on the site is reachable only from
`/now/`, a footer status pill, and an easter egg). Talks has one talk. Bookshelf and Links are in the footer.

*Fix:* Now, Chess, Writing, Résumé. Everything else lives in the footer and on the homepage.

### 2.6 Buttons mean different things on different pages

The homepage primary is gold, projects primary is amber, links page uses both amber-filled and ghost for a nine-
item list, footer theme toggle is gold again. Ghost buttons with 3px borders wrap to two lines on the projects
page ("View stefantaitano.com live").

*Fix:* one filled button (amber) for the one action that matters on a page. Everything else is a link.

---

## 3. Page by page

### Home `/`

Renders as: pixel strip (thin) with the header on top of it, then a very large headline, a handwritten aside,
a bio, two buttons, a small "What I'm doing now" block, three gray article cards, a newsletter card, a footer.

- The pixel scene is the best thing on the site and it gets 16rem, then scrolls away. The header sitting on it
  means the logo and nav are cream-on-ink for one screen and ink-on-cream after, with a JS dock. Two header
  states for one page is a lot of machinery for a strip.
- The headline is 107px at desktop with a 1.45 line height. It takes most of the first screen to say one sentence.
- A stranger's first question, "where do I go," is not answered. The two buttons are "Read my first talk" and
  "View my résumé": one for a developer, one for a recruiter, nothing for chess, nothing for "just curious."
- "What I'm doing now" is body-size prose under a handwritten label. It reads like a footnote to the hero.
- The article cards repeat the article page's look on the homepage. The newsletter card repeats "Browse articles."

*Direction:* answer "who is this" in one screen and "where do I go" right under it, with one door per visitor
type. Everything else becomes a quiet ledger below. The scene stays and gets to be the whole width, either as
the top of the page (Home B) or as the horizon between "who I am" and "what's new" (Home A).

### Chess `/chess/`

Renders as: page intro, Scoreboard, Annotated game, Compare with me, Right now (a table with one row),
Rapid rating (chart), Last five games (table), a challenge link.

- The current rating appears three times on the page (Scoreboard, Right now table, chart caption). "Right now"
  is a table for one number.
- The scoreboard is the reason the page exists, and it is under a generic intro with a 68px "Scoreboard"
  heading. The number itself is 27 to 44px.
- The chart has no target line, so it does not show the thing the experiment is about. It is capped at 45rem
  and the axis text is 14px in a 720-unit viewBox, unreadable on a phone.
- The games table overflows on mobile (Date column clipped at 390px).
- "Compare with me" sits between the annotated game and the stats, interrupting the story before it starts.

*Direction:* the number is the headline. One rail from start to target with the current marker (it can sit
left of start, the drop stays visible). Then the chart with the target drawn on it. Then games as a list.
Then the annotated game. Compare last, since it is the one thing that asks the visitor to do work.

### Now `/now/`

Plain prose page. Good shape, wrong size. The `h2` "Chess" is as big as the `h1` "Now." The stats table
caption wraps awkwardly ("Lichess rating and / games played"). The Chess block duplicates `/chess/`.

*Direction:* keep the page. Shrink the headings. Replace the chess block with one live sentence and a link.

### Articles `/articles/`

Two-column masonry of gray cards. Works. The cards are the only thing that says "starter." Titles in Fraunces
at 27 to 44px on cards next to each other compete with one another.

*Direction:* a list. Title, one line, date. Hairline between rows. The article page itself can stay.

### Talks `/talks/`

A full-bleed dark hero with a pink radial glow and a pink handwritten kicker. Pink is not in the palette
anywhere else on the site. Then one talk. The heading is underlined at 44px.

*Direction:* no hero. Same label-and-row treatment as everything else. When there are three talks it can earn
a page; today it is one row on the homepage and a section in the footer.

### Projects `/projects/`

Three tall bordered cards with title, status, date, tag pills, description, two labeled sub-sections, and two
buttons. Twelve elements per card. Buttons wrap. Card heights differ.

*Direction:* one project per row: title, one sentence, the tech as plain text, one link. "Why I built it / what
came out of it" is good content and belongs on the article page for each project, not in a card.

### Bookshelf `/bookshelf/`

Handwritten group labels, bordered cards, format pills. Same card fatigue as projects. The referral note is
fine.

*Direction:* rows grouped under small labels. Title, author, one line. Format as plain text, not a pill.

### Résumé `/resume/`

The best-behaved page. Narrow column, clear hierarchy, PDF button first. Amber section rules under uppercase
headings are the right idea for the whole site. Contact row wraps to three lines at 390px.

*Direction:* keep. This page is closest to where the rest should go.

### Links `/links/`

Linktree shape. Nine full-width buttons, three filled, six ghost. The photo hold easter egg is fun.

*Direction:* keep the shape, it is what people expect from a `/links/` URL. Filled buttons for the three that
matter, plain text links for the rest, so the list is half as tall.

---

## 4. Three directions

All three keep the tokens, the fonts, the pixel scene, and the live data. They differ in what leads.

### A. Field Notes (mocked: `/design-lab/home/`)

Paper first. A small eyebrow, the headline at a reading size, the bio, then four doors: Hiring? Developer?
Chess? Just curious? Each door is a label, a title, one line, an arrow. No boxes. The chess door reads the
live rating. The pixel scene becomes a full-width horizon between the doors and the ledger below (now, writing,
the talk). One filled button on the whole page, for the newsletter.

*Why it fits:* it is the voice of the site made visible. Quiet, specific, direct. It scales to every other
page with one rule: label, row, hairline.

*Risk:* the first screen is type only. The scene is a scroll away. Some visitors will not scroll.

### B. Night Sky (mocked: `/design-lab/home-night/`)

Ink first. Header, eyebrow, headline, and bio sit on the night. The starfield begins under the bio and the
hills carry the eye down to paper, where the doors and ledger are identical to A.

*Why it fits:* the most unique asset is the first thing anyone sees. It is also cheaper than it looks: same
components as A in a different order, one body class.

*Risk:* dark-first pages photograph well and read worse. The header is a second color scheme to maintain.
The scene needs to look intentional at every width; today the strip is 128 rows tall and does not grow.

### C. Status board (not mocked)

Lean all the way into the live data. The homepage is a monospace board: `now`, `rapid`, `reading`,
`last shipped`, `next`. One display headline, everything else in `--font-mono`. Chess becomes the model for
the whole site.

*Why it might fit:* it is the most "developer" of the three and the most obviously unique.

*Why it is not mocked:* it fights the voice. The site is warm and personal; a terminal is neither. It also
makes the recruiter and the curious visitor work harder. Listed so the option is on the table.

### Recommendation

A, with B's first screen as a possible follow-up once A is on every page. The doors are the UX fix; the rest
is discipline. Chess as mocked works under either.

---

## 5. What the mockups are made of

Everything is on the branch under `src/`. It is all throwaway.

| File | What it is |
| --- | --- |
| `src/_layouts/lab.njk` | A minimal shell so the mocks can show a different header and footer. Exists only to avoid touching `base.njk` for a mock. If a direction ships, `base.njk`, `header.njk`, and `footer.njk` are extended and this file is deleted. |
| `src/_includes/partials/lab-header.njk` | Review bar + the proposed header: name, four links, live Lichess status. |
| `src/_includes/partials/lab-doors.njk` | The four doors. Chess door reads `lichess.scoreboard`. |
| `src/_includes/partials/lab-ledger.njk` | Now, Writing, First talk columns + the newsletter line. |
| `src/_includes/partials/lab-footer.njk` | Text-only footer, theme switch kept. |
| `src/pages/design-lab/*.njk` | Index, Home A, Home B, Chess. All `eleventyExcludeFromCollections`, `noindex`. |
| `src/assets/css/local/design-lab.css` | The whole system. Reads existing tokens only. |

Data is untouched. The chess mock reads the same `lichess.js`, `experiment.yaml`, and `study.json` as `/chess/`,
and the compare-with-me login still works because the chart keeps its `chess-chart__*` hooks.

---

## 6. If a direction is picked

Rough phase shape, to be written up properly as `docs/redesign-project-plan.md`:

0. Type and spacing pass in `global-styles.css` and the tokens: body size, heading scale, one column width.
   Every page gets quieter without changing a template.
1. Header and footer (`header.njk`, `footer.njk`, `main-nav.css`): new nav order, text footer.
2. Home: doors, ledger, scene placement (A or B).
3. Chess: scoreboard hero, chart with target, games list, section order.
4. Lists: articles, projects, bookshelf, talks become label-and-row pages. Post layout untouched.
5. Now and résumé: heading sizes only.
6. OG images, if the new homepage changes what the default card should say.

Each phase is one session and ships on its own.
