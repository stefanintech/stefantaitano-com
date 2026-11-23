# 2027 new year refresh

Clickable mockup only. Draft preview at `/next-2027/`. The live site stays as it is.

## Goal

Subtract until the home page is a short hello, one signature feature, and a few latest items. The signature feature is a bot crew board. The restraint is in the spirit of [leerob.com](https://leerob.com/). The shape (a short bio, plus one feature) is in the spirit of [mattpalmer.io](https://mattpalmer.io/).

## The four ideas

1. **Bot crew board on the home page.** Cards for bolt, inky, postcard, Imogen, and captain. Names and Open Bot Avatars come from `src/_data/crew.yaml`. Each other card shows what that bot is doing and a last job time. A visible "Sample data" tag sits on the board. Postcard is the exception: one fixed line, "check-ins post a day later". No live status, no current activity, and no last job time on that card. A timestamp or a "doing now" line would show that Stefan is out and skip the 24 hour `publishAfter` delay.
2. **Slim home.** A short hello, then the crew board, then the 3 to 5 latest items from the existing collections, then one link to everything else. The hello is placeholder copy for inky. It covers dad, ServiceNow consultant, learning in public, and heading to Chiang Mai in early 2027. The move sentence is its own element so it can come out in one edit.
3. **`/now` as one snapshot.** `/next-2027/now/` has sections for work, learning, the move, running, and building. Placeholder text, labeled. `/next-2027/now/archive/` lists the existing dated `/now` entries.
4. **Trimmed footer.** A few links stay visible. Resume, feeds, privacy, accessibility, and colophon sit under a "More" disclosure.

## What is mock, and what is real

Mock, and labeled on the page:

- The hello, and the move sentence inside it.
- Crew board activity lines and last job times, from `src/_data/next2027Board.json`. Sample data, not a feed.
- Postcard's line, which is fixed in the template. The JSON file has no time for postcard, and the template will not print one even if a later file adds it.
- The five sections on `/next-2027/now/`.

Real, read from the site as it is:

- Bot names, jobs are not shown, and avatar drawings from `src/_data/crew.yaml`, mounted with the vendored Open Bot Avatar script.
- The latest items, from `collections.homeStream` (posts, published check-ins, and `/now` entries).
- The archive list, one link per existing `/now` entry, pointing at `/now/#…`.
- Footer links to pages that already exist (resume, both feeds, privacy, accessibility, colophon, posts, check-ins).

The board JSON is a flat list of `{slug, doing, lastJobAt, lastJobLabel}` plus postcard as `{slug, line}` only. A later phase can replace that file with a privacy-safe JSON feed. Mail, calendar, finance, and personal contents stay out of it. Postcard stays the fixed line.

## Kept off the live site

- Paths: `/next-2027/`, `/next-2027/now/`, `/next-2027/now/archive/`.
- `noindex, nofollow`. Out of the sitemap, the feeds, and the live header and footer. Nothing on a live page links here.
- No edits to existing pages, layouts those pages use, `package.json`, the lockfile, workflows, headers, redirects, or Netlify config.

## Open questions

- After the move, delete the Chiang Mai sentence, or replace it?
- Once the board is real, does it stay in the open on the home page, or become the one hidden feature?
- Are Home, Now, Posts, and Check-ins the right few footer links?
- Should "Everything else" keep pointing at the current home, or at posts, check-ins, and `/now` as separate links?
- What may the later JSON file say for bolt, inky, Imogen, and captain, given that mail, calendar, finance, and personal contents stay out, and postcard never gets a time?
- Does the hello name the kids (first name only), or is "dad" enough?
