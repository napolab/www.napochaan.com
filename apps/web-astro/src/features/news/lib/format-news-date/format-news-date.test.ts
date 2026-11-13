import { describe, expect, it } from 'vitest';

import { formatNewsDate, formatNewsMonthDay } from './index';

describe('formatNewsDate', () => {
  it('formats the detail kicker / OG date in Asia/Tokyo', () => {
    expect(formatNewsDate('2026-06-10')).toBe('2026.06.10');
  });
});

describe('formatNewsMonthDay', () => {
  it('formats the archive row date in Asia/Tokyo', () => {
    expect(formatNewsMonthDay('2026-06-10')).toBe('06.10');
  });
});
