# Site review log

One row per finding from the Monday site review. The plan is `docs/site-loop-project-plan.md`.

Date is the day it was logged (`YYYY-MM-DD`). Owner is the bot who has it. Status is one of: `open`, `in progress`, `needs Stefan's words`, `needs Stefan's pick`, `waiting on Stefan's input`, `awaiting inky pass`, `parked`, `shipped`. Link is the page, file, or PR a person can open. When a PR opens or the fix ships, update Status and Link. Leave the row in the table. A check that came back clean is a note under the table, not a row.

| Date | Finding | Owner | Status | Link |
| --- | --- | --- | --- | --- |
| 2026-11-13 | Anchorage label ellipsizes in the Alaska inset. The cleanup PR is not open yet. | bolt | in progress | [/checkins/](https://stefantaitano.com/checkins/) |
| 2026-11-13 | May 4 `/now` typo: "immeditately". inky still has to send the replacement text. | inky | in progress | [/now/#now-2026-05-04](https://stefantaitano.com/now/#now-2026-05-04) |
| 2026-11-13 | April 15 `/now` has two chess goals: "700 to 1200" in that entry, and "over 1000" in the Chess block on the same page. | inky | in progress | [/now/#now-2026-04-15](https://stefantaitano.com/now/#now-2026-04-15) |
| 2026-11-13 | Check-in alt text is repeated on the day and night images, and the strings are long. | Imogen | in progress | [`checkin-figure.njk`](../src/_includes/partials/checkin-figure.njk) |
| 2026-11-13 | Top `/now` entry is dated Nov 2 and is stale. | inky | needs Stefan's words | [/now/](https://stefantaitano.com/now/) |
| 2026-11-13 | Newest blog post is Jul 24. | inky | needs Stefan's pick | [/articles/i-built-a-sticker-machine-for-my-kids/](https://stefantaitano.com/articles/i-built-a-sticker-machine-for-my-kids/) |
| 2026-11-13 | Bento sample. Left open on purpose. Out of overdue checks. | bolt | parked | [#82](https://github.com/stefanintech/stefantaitano-com/pull/82) |
| 2026-11-13 | `/ai` is out of date ("Last updated September 2026") and says the Grok Bot projects are paused, which contradicts `/now`. inky proposes a section on how the site gets built with bots. Stefan decides how much goes public. | inky | waiting on Stefan's input | [/ai/](https://stefantaitano.com/ai/) |
| 2026-11-13 | `/projects` is missing the photo frame family hub (Oct 20) and the check-ins map. | inky | waiting on Stefan's input | [/projects/](https://stefantaitano.com/projects/) |
| 2026-11-13 | `/bookshelf` statuses may be stale. The Psychology of Money is "on pause", and Mistborn is "finally starting". Each needs a one-word status from Stefan. | inky | waiting on Stefan's input | [/bookshelf/](https://stefantaitano.com/bookshelf/) |
| 2026-11-13 | Carryovers: the Alaska `/now` entry is out of date, there's been no blog post since July 24, and the CTA results and chess follow-up were never posted. | inky | waiting on Stefan's input | [/now/#now-2026-11-02-alaska](https://stefantaitano.com/now/#now-2026-11-02-alaska) |
| 2026-11-13 | Low priority. Three `/now` images (Boot.dev streak, OSRS wheat farm, WoW character select) have long alt text that needs shortening. | Imogen, then inky | awaiting inky pass | [Boot.dev streak](https://stefantaitano.com/now/#now-2026-10-24), [OSRS wheat farm](https://stefantaitano.com/now/#now-2026-10-21), [WoW character select](https://stefantaitano.com/now/#now-2026-10-30) |
| 2026-11-13 | Low severity. `/articles/creating-my-new-website-in-2026/`: "Year ago, I set up a site using Hugo" is missing a word. | inky | open | [/articles/creating-my-new-website-in-2026/](https://stefantaitano.com/articles/creating-my-new-website-in-2026/) |
| 2026-11-13 | Low severity. `/articles/military-transition-into-the-servicenow-training-program/`: "because its" appears twice and needs "it's", "wasnt" needs "wasn't", and "self pace course" needs fixing. | inky | open | [/articles/military-transition-into-the-servicenow-training-program/](https://stefantaitano.com/articles/military-transition-into-the-servicenow-training-program/) |
| 2026-11-13 | Low severity. `/articles/im-de-googling-my-familys-digital-life/`: the headings jump from h1 straight to h3. Markup only. | bolt | open | [/articles/im-de-googling-my-familys-digital-life/](https://stefantaitano.com/articles/im-de-googling-my-familys-digital-life/) |
| 2026-11-13 | Low severity. `/articles/military-transition-into-the-servicenow-training-program/`: the headings jump from h1 straight to h4. Markup only. | bolt | open | [/articles/military-transition-into-the-servicenow-training-program/](https://stefantaitano.com/articles/military-transition-into-the-servicenow-training-program/) |
| 2026-11-13 | Low severity. `/blog` and `/blog/` return 404. Nothing on the site links to them, and posts live at `/articles/`. Suggested fix: a redirect `/blog/*` to `/articles/` in `src/common/_redirects.njk`, not in Netlify settings. | bolt | open | [`_redirects.njk`](../src/common/_redirects.njk) |

**Checked clean 2026-11-13.** Internal links, overflow at 1440 and 390, contrast, page weight, and the check-in image rules.
