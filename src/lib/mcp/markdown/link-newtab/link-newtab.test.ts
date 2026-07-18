import { describe, expect, it } from 'vitest';

import { resolveNewTab } from '.';

const SITE = 'https://napochaan.com';

describe('resolveNewTab', () => {
  it.each([
    ['https://booth.pm/ja/items/1', true],
    ['http://example.com/page', true],
    ['https://napochaan.com/blog/v3', false],
    ['https://NAPOCHAAN.COM/blog/v3', false], // URL が hostname を小文字正規化するので自ホスト
    ['https://stg.napochaan.com/blog/v3', true], // サブドメインは別ホスト扱い（spec 承認済み）
    ['/blog/v3', false],
    ['#section', false],
    ['mailto:hi@napochaan.com', false],
    ['tel:+81-90-0000-0000', false],
    ['not a url', false],
    ['', false],
  ])('resolveNewTab(%j) === %j', (url, expected) => {
    expect(resolveNewTab(url, SITE)).toBe(expected);
  });

  it('siteBaseUrl がパース不能でも throw せず false に落ちる', () => {
    expect(resolveNewTab('https://example.com', 'not a url')).toBe(false);
  });
});
