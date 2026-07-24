---
title: I Built a Sticker Machine for My Kids
description: I put together a local app so my kids can say a sticker idea out loud and print a coloring-page label at home.
date: 2026-07-23T21:30:00-05:00
draft: false
permalink: /articles/i-built-a-sticker-machine-for-my-kids/index.html
related:
  - title: I’m De-Googling My Family’s Digital Life
    url: /articles/im-de-googling-my-familys-digital-life/
  - title: It is 2026 and I’m learning Ruby on Rails
    url: /articles/it-is-2026-and-im-learning-ruby-on-rails/
---

So I just finished building a sticker machine for my kids, and honestly it turned out pretty cool.

You can type an idea or hold a button on your phone, say something like "a happy sun," and it turns that into a black-and-white coloring-page image. Then a Phomemo PM-241BT prints it as a 4x6 adhesive label. The fun path is hold-to-talk from a phone on the same Wi-Fi: describe the sticker, let go, watch a quick preview, and the printer starts. I tested that end to end from an iPhone and real stickers came out, which felt pretty awesome.

The code is on GitHub: [family-sticker-app](https://github.com/stefanintech/family-sticker-app). I got the idea from [Wes Bos's sticker-dream](https://github.com/wesbos/sticker-dream), and I pretty much wanted the same itch scratched, just something small enough to keep local and easy enough that my kids did not have to type if they did not want to.

Under the hood it is nothing fancy. One Flask app, one HTML page, vanilla JS, Gemini for the image and the voice stuff, Pillow to keep everything black and white, and CUPS to send it to the printer.

Believe it or not, the printer was the easy part. The PM-241BT was already set up as a CUPS queue on my Mac, so I never had to reverse-engineer USB. The first prints still clipped sun rays at the edges, so I padded the artwork with a little white margin before sending it. After that, the stickers looked right.

A few other things got in the way. Image generation needed billing enabled before it would work, and voice needed HTTPS because browsers will not hand over the mic over plain HTTP from a phone. If you ask for named copyrighted characters, you usually get generic stand-ins instead, so describing the look works better than naming the franchise.

All in all, kid says the idea, printer spits out something they can color and stick somewhere, and that was enough for me.
