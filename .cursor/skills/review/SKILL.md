---
name: review
description: A read-only pre-merge review of a stefantaitano.com PR.
---

If these instructions are not already its mode, read this file before starting.

# Review

This is a sticky custom mode named `review`. Stay in it for the whole pre-merge pass. The pass is read-only.

## Stay read-only

Never push commits, never merge, and never close the PR. Do not edit files, open a branch, or change the PR title, body, or labels. Do not submit a pull request review. The only write is one PR conversation comment, edited in place on a re-review.

## Read the rules

Read these before judging the diff:

- `AGENTS.md`
- every `.cursor/rules/*.mdc` file
- `docs/site-voice.md`
- any `docs/*-project-plan.md` that the PR touches

## Check the diff

Get the PR diff and check it against those rules. Flag:

- scope creep beyond the PR's stated purpose
- parallel layouts
- Tailwind or token pipelines
- test changes that loosen assertions

## Security

When the PR touches code, forms, scripts, third-party embeds, redirects, headers, or build/deploy config, include this in the same review on the final head. No extra round.

- Exposed secrets (name `CHECKIN_REBUILD_HOOK_URL` and `CHECKIN_MAP_EXCLUDE` only; never print or commit their values), unsafe embeds or scripts, location or privacy leaks (check-in coordinates and EXIF), dependency risks, and missing security headers. Put findings under **Secrets and privacy**.

## Tests and build

Run each command and report the pass or fail result of each:

- `npm ci`
- `npm test`
- `npm run build`

For a check-in PR, also run `npm run checkins:images -- --check` and report its pass or fail result.

## Preview

Check the Netlify deploy preview at `https://deploy-preview-<N>--stefantaitano.netlify.app`, where `<N>` is the PR number. Open the pages the PR changes, in the light and dark themes and at the 1440 and 390 widths, and note any visual breakage.

## Secrets and privacy

Check for secrets and private data.

Flag any value of `CHECKIN_REBUILD_HOOK_URL` or `CHECKIN_MAP_EXCLUDE`, or a webhook, token, or key. Report only where it appears. Never print the value.

Also flag:

- EXIF or GPS metadata in images
- home addresses
- family members' names or details
- kids' faces or names
- exact home-area locations
- a check-in pushed before its `publishAfter`

## Copy

For copy, check that approved text is verbatim. Do not rewrite copy.

## Post the review

Post the findings as one PR conversation comment (an issue comment on the PR). Head it "Pre-merge review". Do not call `POST /pulls/{n}/reviews`; this integration gets a 403 there. Never approve and never request changes.

On a re-review, edit that same comment. Do not add a new one.

Use these sections:

- **Verdict** — `CLEAN` or `ISSUES`
- **Rules**
- **Tests and build**
- **Preview**
- **Secrets and privacy**

When the verdict is `ISSUES`, list each finding under that verdict with its file and line plus a suggested fix.

End the final report with the verdict line.
