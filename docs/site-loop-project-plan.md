# Weekly site review — Project plan

A Monday pass over the live site. Findings go in one log. Small safe fixes share one PR. Stefan still merges.

**Status (13 Nov 2026):** Stefan approved the loop. This file and `docs/site-review-log.md` are the whole of it. No site code in this change.

**Outcome:** Every Monday morning (Central time), the bots look at [stefantaitano.com](https://stefantaitano.com), write down what they found, and either ship a small fix or ask Stefan for the words. A week with nothing new stays quiet.

**Cut**

- Merging a PR without Stefan's OK on that PR. A plain check-in is the one exception, below.
- Bolt writing page copy from scratch.
- A check-in on GitHub or the site before Stefan has approved it and `publishAfter` has passed.
- Netlify settings, DNS, or billing.
- Closing [bento PR #82](https://github.com/stefanintech/stefantaitano-com/pull/82), or treating it as overdue.
- A digest posted on the site, a new page, or a new layout.
- Private notes, people, home, schools, coordinates, or directions. The check-in rules still apply.

---

## Decisions

| Question | Call (13 Nov 2026) |
| --- | --- |
| When | Every Monday morning, Central time. |
| Who writes the repo | **bolt**, the engineering lead. The others draft, check, and report. |
| What bolt checks | The live site: broken links, layout bugs, accessibility (including missing or duplicate alt text), performance, and the check-in image rules. |
| What inky checks | `/now`, posts, and check-ins: stale entries, typos, and loose threads. inky drafts any copy fix. |
| Alt text | **Imogen** writes alt text for new or weak images. inky checks that it sounds like the rest of the site. |
| Check-ins | **postcard** owns them. |
| What needs Stefan | **captain** collects anything that needs Stefan's words or a decision into one short list in its main chat. |
| Small fixes | Typos, broken links, alt text, and small CSS fixes go in **one PR per batch**. Each of those PRs gets its own review pass and waits for Stefan's merge OK. |
| Digest | One short Monday note: found, waiting on Stefan, shipped. Send it only when something changed. |
| A repeat | The second time the same issue shows up, propose a rule in `AGENTS.md` or `.cursor/rules/` so it stops coming back. |
| Plain check-ins | bolt may auto-merge once checks pass. Stefan's standing decision, 6 Nov 2026. Approval and `publishAfter` still come first. |
| Bento | PR #82 stays open. Parked by Stefan's choice, 13 Nov 2026. Leave it out of overdue checks. Do not close it. |

---

## This repo (already in place)

The loop reads and updates these. It does not add a second review system.

| What | Where |
| --- | --- |
| This plan | `docs/site-loop-project-plan.md` |
| The log | `docs/site-review-log.md` |
| Agent notes | `AGENTS.md` |
| Standing rules | `.cursor/rules/` |
| Copy | `docs/site-voice.md` |
| Pre-merge review | `.cursor/skills/review/SKILL.md` |
| `/now` | `src/now-entries/`, `src/pages/now.njk` |
| Posts | `src/posts/` |
| Check-ins | `src/checkins/`, `.cursor/rules/checkins.mdc`, `docs/checkins-project-plan.md` |
| Check-in images | `src/assets/images/checkins/`, `npm run checkins:images -- --check` |
| Check-in alt markup | `src/_includes/partials/checkin-figure.njk` |
| City map | `docs/checkins-map-project-plan.md`, `docs/checkins-map-insets-project-plan.md` |
| Live site | `https://stefantaitano.com` |

---

## Standing rules

- bolt is the only one who commits, pushes, or opens a PR.
- Copy fixes use Stefan's words, or a draft inky already wrote and Stefan has seen. bolt does not invent the sentence.
- A check-in follows `.cursor/rules/checkins.mdc`. postcard owns the entry. It reaches GitHub only after Stefan has approved it and `publishAfter` has passed. bolt may then merge that PR once the checks pass, without asking again. That auto-merge is for a plain check-in only.
- Every other PR waits for Stefan's OK on that specific PR. A review that comes back clean is the point where he gets asked. The review pass is the one in `.cursor/skills/review/SKILL.md`.
- Do not change Netlify settings, DNS, or billing.
- Do not print `CHECKIN_MAP_EXCLUDE` or `CHECKIN_REBUILD_HOOK_URL`.
- Voice for anything a visitor reads: `docs/site-voice.md`.

---

## Each Monday

1. **Review.** bolt checks the live site for broken links, layout bugs, accessibility (including missing or duplicate alt text), performance, and the check-in image rules. inky reads `/now`, posts, and check-ins for stale entries, typos, and loose threads, and drafts any copy fix. Imogen writes alt text for a new or weak image, and inky voice-checks it. postcard handles check-ins.
2. **Log.** Every finding gets a row in `docs/site-review-log.md`: date, owner, status, and a link. Update the row when a PR opens or the fix ships. Leave old rows in the file.
3. **Fix.** Group the small safe fixes (typos, broken links, alt text, small CSS fixes) into one PR. That PR gets its own review pass, then waits for Stefan's merge OK. A plain check-in is the exception in the standing rules.
4. **Digest.** One short note in captain's main chat: found, waiting on Stefan, shipped. captain puts anything that needs Stefan's words or a decision in that same short list. If nothing changed, send nothing.
5. **Stop the repeat.** When the same issue shows up a second time, propose a rule in `AGENTS.md` or `.cursor/rules/` so the next Monday does not find it again. That proposal is a PR, and Stefan merges it.

**Done when:** the log has a row for each finding from that pass, any small safe fixes are in one reviewed PR waiting on Stefan, and captain's chat has the short list (or stayed quiet because nothing changed).

---

## Parked

[Bento PR #82](https://github.com/stefanintech/stefantaitano-com/pull/82) is parked by Stefan's choice (13 Nov 2026). Leave it open. Leave it out of overdue checks. Do not close it.
