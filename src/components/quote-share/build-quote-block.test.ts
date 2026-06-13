import { describe, expect, it } from 'vitest';

import { buildQuoteBlock } from './build-quote-block';

describe('buildQuoteBlock', () => {
  it('formats the quote, title and url as a shareable block', () => {
    expect(buildQuoteBlock('本文', 'タイトル', 'https://www.napochaan.com/blog/1')).toBe('> 本文\nタイトル | https://www.napochaan.com/blog/1');
  });

  it('clips a long quote to 100 chars', () => {
    expect(buildQuoteBlock('あ'.repeat(150), 'T', 'https://x.test/p')).toBe(`> ${'あ'.repeat(100)}…\nT | https://x.test/p`);
  });
});
