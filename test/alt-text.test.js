// Planted pages, not site files. The smoke test runs the same check on dist/.
import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {altProblems, assertAltText} from './checks/alt-text.js';

const page = html => [{page: '/planted/', html}];

describe('alt text', () => {
  it('fails a planted image with no alt attribute, and names the page and src', () => {
    assert.throws(
      () => assertAltText(page('<img src="/planted/no-alt.webp" width="10">')),
      error => {
        assert.match(error.message, /\/planted\/: \/planted\/no-alt.webp \(missing alt\)/);
        return true;
      }
    );
  });

  it('fails a planted empty alt that is not marked decorative', () => {
    const html = '<img src="/planted/empty.webp" alt="">\n<img alt="   " src="/planted/blank.webp">';
    assert.deepEqual(altProblems(page(html)), [
      {page: '/planted/', src: '/planted/empty.webp', reason: 'empty alt is not decorative'},
      {page: '/planted/', src: '/planted/blank.webp', reason: 'empty alt is not decorative'}
    ]);
  });

  it('fails a planted alt that is only entity whitespace', () => {
    const html = [
      '<img src="/planted/nbsp.webp" alt="&nbsp;">',
      '<img src="/planted/num.webp" alt="&#32;">',
      '<img src="/planted/hex.webp" alt="&#x20;">',
      '<img src="/planted/mixed.webp" alt="&nbsp;&#32;  &#x20;">'
    ].join('');
    assert.deepEqual(altProblems(page(html)), [
      {page: '/planted/', src: '/planted/nbsp.webp', reason: 'empty alt is not decorative'},
      {page: '/planted/', src: '/planted/num.webp', reason: 'empty alt is not decorative'},
      {page: '/planted/', src: '/planted/hex.webp', reason: 'empty alt is not decorative'},
      {page: '/planted/', src: '/planted/mixed.webp', reason: 'empty alt is not decorative'}
    ]);
  });

  it('fails a missing alt even when an ancestor is hidden', () => {
    const html = '<div aria-hidden="true"><img src="/planted/hidden.webp"></div>';
    assert.deepEqual(altProblems(page(html)), [
      {page: '/planted/', src: '/planted/hidden.webp', reason: 'missing alt'}
    ]);
  });

  it('allows an empty alt marked role="presentation", role="none", or aria-hidden="true"', () => {
    const html = [
      '<img src="/ok/presentation.webp" alt="" role="presentation">',
      '<img src="/ok/none.webp" alt="" role="none">',
      '<img src="/ok/hidden.webp" alt="" aria-hidden="true">',
      '<div aria-hidden=" TRUE "><img src="/ok/ancestor.webp" alt=""></div>',
      '<a href="/checkins/" aria-hidden="true"><img src="/ok/hidden-link.webp" alt=""></a>'
    ].join('');
    assert.deepEqual(altProblems(page(html)), []);
  });

  it('allows the links-page avatar: empty alt inside a named button', () => {
    const html = `<button type="button" class="links-avatar" aria-label="Stefan Taitano">
      <picture><source srcset="/img/stefan.avif"><img src="/img/stefan.jpeg" alt=""></picture>
    </button>`;
    assert.deepEqual(altProblems(page(html)), []);
  });

  it('allows an empty alt inside a button named by an existing aria-labelledby', () => {
    const html = `<button type="button" aria-labelledby="avatar-name">
      <img src="/img/stefan.jpeg" alt="">
    </button>
    <span id="avatar-name">Stefan Taitano</span>`;
    assert.deepEqual(altProblems(page(html)), []);
  });

  it('fails a planted empty alt inside a labelled link', () => {
    const html = [
      '<a href="/p/" aria-label="Read more"><div><img src="/hero.webp" alt=""></div></a>',
      '<button aria-label="Outer"><a href="/p/" aria-label="Inner"><img src="/planted/nested-link.webp" alt=""></a></button>'
    ].join('');
    assert.deepEqual(altProblems(page(html)), [
      {page: '/planted/', src: '/hero.webp', reason: 'empty alt is not decorative'},
      {page: '/planted/', src: '/planted/nested-link.webp', reason: 'empty alt is not decorative'}
    ]);
  });

  it('fails a planted aria-labelledby that points at a missing id or empty text', () => {
    const html = [
      '<button aria-labelledby="nope"><img src="/planted/missing-id.webp" alt=""></button>',
      '<button aria-labelledby="blank"><span id="blank"> &nbsp; </span><img src="/planted/blank-name.webp" alt=""></button>'
    ].join('');
    assert.deepEqual(altProblems(page(html)), [
      {page: '/planted/', src: '/planted/missing-id.webp', reason: 'empty alt is not decorative'},
      {page: '/planted/', src: '/planted/blank-name.webp', reason: 'empty alt is not decorative'}
    ]);
  });

  it('fails a planted empty or bare aria-hidden', () => {
    const html = [
      '<div aria-hidden=""><img src="/planted/empty-hidden.webp" alt=""></div>',
      '<img src="/planted/bare-hidden.webp" alt="" aria-hidden>'
    ].join('');
    assert.deepEqual(altProblems(page(html)), [
      {page: '/planted/', src: '/planted/empty-hidden.webp', reason: 'empty alt is not decorative'},
      {page: '/planted/', src: '/planted/bare-hidden.webp', reason: 'empty alt is not decorative'}
    ]);
  });

  it('fails a planted empty alt once an implied end tag has closed the hidden ancestor', () => {
    const html = [
      '<ul><li aria-hidden="true">hidden<li><img src="/planted/next-li.webp" alt=""></ul>',
      '<ul><li aria-hidden="true"><div><li><img src="/planted/li-in-div.webp" alt=""></ul>',
      '<p aria-hidden="true">x<div><img src="/planted/after-p.webp" alt=""></div>',
      '<p aria-hidden="true">x<span><div><img src="/planted/p-span-div.webp" alt=""></div></span>',
      '<dl><dt aria-hidden="true">term<dd><img src="/planted/after-dt.webp" alt=""></dl>',
      '<dl><dd aria-hidden="true">def<dt><img src="/planted/after-dd.webp" alt=""></dl>',
      '<select><option aria-hidden="true">a<option><img src="/planted/after-option.webp" alt=""></select>',
      '<table><tr aria-hidden="true"><td>a<tr><td><img src="/planted/after-tr.webp" alt=""></table>',
      '<table><tr><td aria-hidden="true">a<td><img src="/planted/after-td.webp" alt=""></table>',
      '<table><tr><th aria-hidden="true">a<th><img src="/planted/after-th.webp" alt=""></table>'
    ].join('');
    assert.deepEqual(altProblems(page(html)), [
      {page: '/planted/', src: '/planted/next-li.webp', reason: 'empty alt is not decorative'},
      {page: '/planted/', src: '/planted/li-in-div.webp', reason: 'empty alt is not decorative'},
      {page: '/planted/', src: '/planted/after-p.webp', reason: 'empty alt is not decorative'},
      {page: '/planted/', src: '/planted/p-span-div.webp', reason: 'empty alt is not decorative'},
      {page: '/planted/', src: '/planted/after-dt.webp', reason: 'empty alt is not decorative'},
      {page: '/planted/', src: '/planted/after-dd.webp', reason: 'empty alt is not decorative'},
      {page: '/planted/', src: '/planted/after-option.webp', reason: 'empty alt is not decorative'},
      {page: '/planted/', src: '/planted/after-tr.webp', reason: 'empty alt is not decorative'},
      {page: '/planted/', src: '/planted/after-td.webp', reason: 'empty alt is not decorative'},
      {page: '/planted/', src: '/planted/after-th.webp', reason: 'empty alt is not decorative'}
    ]);
  });

  it('keeps an empty alt hidden when the ancestor is explicitly closed', () => {
    const html = [
      '<ul><li aria-hidden="true"><img src="/ok/in-li.webp" alt=""></li><li><img src="/ok/next.webp" alt="Next"></li></ul>',
      '<p aria-hidden="true"><img src="/ok/in-p.webp" alt=""></p><div><img src="/ok/after.webp" alt="After"></div>'
    ].join('');
    assert.deepEqual(altProblems(page(html)), []);
  });

  it('reads a > inside a quoted attribute as part of the tag', () => {
    const html = [
      '<img title="a>b" src="/planted/quoted-gt.webp" alt="">',
      '<img alt="1 > 0" src="/ok/alt-gt.webp">',
      '<img title="a>b" src="/ok/titled.webp" alt="A clay glacier">'
    ].join('');
    assert.deepEqual(altProblems(page(html)), [
      {page: '/planted/', src: '/planted/quoted-gt.webp', reason: 'empty alt is not decorative'}
    ]);
  });

  it('fails a planted presentation role on a parent', () => {
    const html = '<section role="presentation"><figure><img src="/planted/parent-role.webp" alt=""></figure></section>';
    assert.deepEqual(altProblems(page(html)), [
      {page: '/planted/', src: '/planted/parent-role.webp', reason: 'empty alt is not decorative'}
    ]);
  });

  it('does not treat a labelled div as the links-page pattern', () => {
    const html = '<div aria-label="Stefan"><img src="/planted/empty.webp" alt=""></div>';
    assert.deepEqual(altProblems(page(html)), [
      {page: '/planted/', src: '/planted/empty.webp', reason: 'empty alt is not decorative'}
    ]);
  });

  it('allows a non-empty alt and ignores an image written inside a script', () => {
    const html = `<script>const sample = '<img src="/planted/script.webp">';</script>
      <img src="/shown.webp" alt="A clay glacier">`;
    assert.deepEqual(altProblems(page(html)), []);
  });
});
