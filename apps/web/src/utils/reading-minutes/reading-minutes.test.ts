import { describe, expect, it } from 'vitest';

import { readingMinutes } from './index';

describe('readingMinutes', () => {
  it('rounds the char count up against the per-minute rate (500)', () => {
    expect(readingMinutes('あ'.repeat(600))).toBe(2);
    expect(readingMinutes('あ'.repeat(500))).toBe(1);
  });

  it('is at least 1 minute for short or empty text', () => {
    expect(readingMinutes('短い')).toBe(1);
    expect(readingMinutes('')).toBe(1);
  });
});
