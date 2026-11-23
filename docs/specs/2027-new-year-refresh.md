# 2027 new year refresh

Clickable mockup only. Draft preview at `/next-2027/`. The live site stays as it is.

## Goal

Subtract until the home page is a short hello, one signature feature, and a few latest items. The signature feature is a bot crew board. The restraint is in the spirit of [leerob.com](https://leerob.com/). The shape (a short bio, plus one feature) is in the spirit of [mattpalmer.io](https://mattpalmer.io/).

## The four ideas

1. **Bot crew board on the home page.** Cards for bolt, inky, postcard, Imogen, and captain. Names and Open Bot Avatars come from `src/_data/crew.yaml`. Each other card shows what that bot is doing and a last job time. A visible "Sample data" tag sits on the board. Postcard is the exception: one fixed line, "check-ins post a day later". No live status, no current activity, and no last job time on that card. A timestamp or a "doing now" line would show that Stefan is out and skip the 24 hour `publishAfter` delay.
2. **Slim home.** A short hello, then the crew board, then the 3 to 5 latest items from the existing collections, then one link to everything else. The hello is final copy, approved by Stefan: "Hello friend, I'm Stefan 👋🏽. I write software, I'm a dad, and I'm probably learning something new right now. Do you like World of Warcraft or chess? Let's be friends!" The wave emoji is wrapped so assistive tech skips it.
3. **`/now` as one snapshot.** `/next-2027/now/` has five sections, in order: Work, Learning, Running, Building, Playing. That copy is final, from inky, approved by Stefan. `/next-2027/now/archive/` lists the existing dated `/now` entries.
4. **Trimmed footer.** A few links stay visible. Resume, feeds, privacy, accessibility, and colophon sit under a "More" disclosure.
5. **Lichess card.** On `/next-2027/` only, a small card shows the final position of the featured game in `src/_data/study.json`, the result, the players, and the line "Latest game on Lichess". The card links to `/chess/`. The position is computed at build time from `https://lichess.org/api/study/{studyId}/{chapterId}.pgn`. `src/_data/chessSan.js` replays the moves. There is no live rating and no client fetch. If the fetch fails, the build uses `src/_data/next2027ChessSnapshot.json`.
6. **Hidden puzzle.** Typing `e` then `4` on the mockup home (ignored in a text field), or tapping a knight button, opens a dialog. One knight sits beside the hello, above the Lichess card, so it is on screen without a keyboard. The same button is also in the footer. The puzzle is one move from that same game: ply 20, `10... Nxh5`, knight from f6 to h5. It is the move that captures the queen. The answer is from-square and to-square only. Copy for the card and the dialog lives in `src/_data/next2027PuzzleCopy.json`. The sentences other than "Latest game on Lichess", "Nice. You'd beat me.", and "Not quite, try again." are placeholders until Stefan says otherwise. The screen-reader position is one field, `puzzle.text`, generated from the FEN.

## What is mock, and what is real

Final copy, from inky, approved by Stefan:

- The hello on `/next-2027/`.
- The five sections on `/next-2027/now/`: Work, Learning, Running, Building, Playing.

Mock, and labeled on the page:

- Crew board activity lines and last job times, from `src/_data/next2027Board.json`. Sample data, not a feed. Visible times are US Central (`America/Chicago`), such as "Nov 22, 2026, 4:40 PM CT".
- Postcard's line, which is fixed in the template. The JSON file has no time for postcard, and the template will not print one even if a later file adds it.

Real, computed for this mockup:

- The Lichess card's final position, players, and result, from the featured study chapter.
- The puzzle position at ply 20 of that game. The knight button and the `e` then `4` keys stay on `/next-2027/` only.

Real, read from the site as it is:

- Bot names and avatar drawings from `src/_data/crew.yaml`, mounted with the vendored Open Bot Avatar script. The job line from `/ai` is not repeated on these cards.
- The latest items, from `collections.homeStream` (posts, published check-ins, and `/now` entries).
- The archive list, one link per existing `/now` entry, pointing at `/now/#…`.
- Footer links to pages that already exist (resume, both feeds, privacy, accessibility, colophon, posts, check-ins).

The board JSON is a flat list of `{slug, doing, lastJobAt, lastJobLabel}` plus postcard as `{slug, line}` only. `src/_data/next2027Crew.js` joins that file to `crew.yaml` for the page. Postcard's joined card has no time fields. A later phase can replace the JSON with a privacy-safe feed. Mail, calendar, finance, and personal contents stay out of it. Postcard stays the fixed line.

## Kept off the live site

- Paths: `/next-2027/`, `/next-2027/now/`, `/next-2027/now/archive/`.
- `noindex, nofollow`. Out of the sitemap, the feeds, and the live header and footer. Nothing on a live page links here.
- No edits to existing pages, layouts those pages use, `package.json`, the lockfile, workflows, headers, redirects, or Netlify config.

## Open questions

- Once the board is real, does it stay in the open on the home page, or become the one hidden feature?
- Are Home, Now, Posts, and Check-ins the right few footer links?
- Should "Everything else" keep pointing at the current home, or at posts, check-ins, and `/now` as separate links?
- What may the later JSON file say for bolt, inky, Imogen, and captain, given that mail, calendar, finance, and personal contents stay out, and postcard never gets a time?
- Which placeholder sentences in `src/_data/next2027PuzzleCopy.json` should stay?
