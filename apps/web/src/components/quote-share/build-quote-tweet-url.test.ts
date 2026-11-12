import { describe, expect, it } from 'vitest';

import { buildQuoteTweetUrl } from './build-quote-tweet-url';

describe('buildQuoteTweetUrl', () => {
  it('puts the whole quote block in the tweet text with no separate url param', () => {
    const href = buildQuoteTweetUrl('本文', 'タイトル', 'https://www.napochaan.com/blog/1');
    expect(href.startsWith('https://twitter.com/intent/tweet?text=')).toBe(true);
    expect(href.includes('&url=')).toBe(false);
    expect(new URL(href).searchParams.get('text')).toBe('> 本文\nタイトル | https://www.napochaan.com/blog/1');
  });
});
