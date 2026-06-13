import { describe, expect, it } from 'vitest';

import { truncateQuote } from './truncate-quote';

describe('truncateQuote', () => {
  it('wraps a short selection in corner brackets', () => {
    expect(truncateQuote('やあ')).toBe('「やあ」');
  });

  it('trims surrounding whitespace', () => {
    expect(truncateQuote('  ことば  ')).toBe('「ことば」');
  });

  it('clips a long selection to 100 chars with an ellipsis', () => {
    const long = 'あ'.repeat(150);
    expect(truncateQuote(long)).toBe(`「${'あ'.repeat(100)}…」`);
  });
});
