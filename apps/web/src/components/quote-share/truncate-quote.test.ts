import { describe, expect, it } from 'vitest';

import { truncateQuote } from './truncate-quote';

describe('truncateQuote', () => {
  it('returns short text unchanged', () => {
    expect(truncateQuote('やあ')).toBe('やあ');
  });

  it('trims surrounding whitespace', () => {
    expect(truncateQuote('  ことば  ')).toBe('ことば');
  });

  it('clips a long selection to 100 chars with an ellipsis', () => {
    expect(truncateQuote('あ'.repeat(150))).toBe(`${'あ'.repeat(100)}…`);
  });
});
