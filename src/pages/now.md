---
title: Now
permalink: /now/index.html
description: 'What Stefan Taitano is focused on right now.'
layout: page
---

Last updated: June 13, 2026

The CTA beta exam is on June 17. The main professional goal right now is getting through that and doing well. Outside of that, Ruby is a side hobby keeping things interesting, chess is still in the rotation, and life outside the browser is steady.

## Work

CTA exam prep is daily. The beta runs June 17 and I've been grinding through the material. After the exam, the focus shifts back to consulting and architecture work.

{% include "partials/exam-countdown.njk" %}

## Learning

I'm dabbling in Ruby and just exploring the language for fun. It's a nice contrast to the structured exam prep.

## Writing

I published a Field Notes issue last month. Writing in public is still part of the plan. Over time more of it will live here, but Medium and Field Notes are both still in the mix.

## Life Outside The Browser

I'm reading [The Psychology of Money](https://www.goodreads.com/book/show/51181015-the-psychology-of-money), watching [The Wire](https://www.imdb.com/title/tt0306414/), and trying to get better at chess slowly enough that it stays fun.

## Chess

Adult improver, trying to climb from 700 to 1200 on Lichess Rapid.

<table style="display: inline-table; inline-size: auto; width: auto; max-inline-size: none; border-collapse: collapse; table-layout: auto;">
  <caption style="text-align: left; margin-bottom: 0.5rem;">Lichess rating and games played</caption>
  <thead>
    <tr>
      <th scope="col" style="padding: 0 2rem 0.4rem 0; text-align: left; vertical-align: top;">Mode</th>
      <th scope="col" style="padding: 0 2rem 0.4rem 0; text-align: left; vertical-align: top;">Rating</th>
      <th scope="col" style="padding: 0 0 0.4rem 0; text-align: left; vertical-align: top;">Games</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td data-label="Mode" style="padding: 0 2rem 0.35rem 0; text-align: left; vertical-align: top;">Rapid</td>
      <td data-label="Rating" style="padding: 0 2rem 0.35rem 0; text-align: left; vertical-align: top;">{{ lichess.perfs.rapid.rating }}</td>
      <td data-label="Games" style="padding: 0 0 0.35rem 0; text-align: left; vertical-align: top;">{{ lichess.perfs.rapid.games }}</td>
    </tr>
    <tr>
      <td data-label="Mode" style="padding: 0 2rem 0.35rem 0; text-align: left; vertical-align: top;">Puzzles</td>
      <td data-label="Rating" style="padding: 0 2rem 0.35rem 0; text-align: left; vertical-align: top;">{{ lichess.perfs.puzzle.rating }}</td>
      <td data-label="Games" style="padding: 0 0 0.35rem 0; text-align: left; vertical-align: top;">{{ lichess.perfs.puzzle.games }}</td>
    </tr>
  </tbody>
</table>

Record: **{{ lichess.count.win }}W / {{ lichess.count.draw }}D / {{ lichess.count.loss }}L**

_stats update on every site build_

[Challenge me on Lichess](https://lichess.org/@/Late2TheBoard)

## Supporting

[Vets Who Code](https://vetswhocode.io/) is one of the groups I am glad to support. I like being connected to work that helps veterans get into tech and build a second chapter.

---

_This page is inspired by [nownownow.com](https://nownownow.com/about)._
