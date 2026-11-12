import { describe, expect, it } from 'vitest';

import { dayjs } from './index';

describe('dayjs helper', () => {
  it('formats a fixed instant in Asia/Tokyo', () => {
    expect(dayjs('2026-01-01T00:00:00Z').tz('Asia/Tokyo').format('HH:mm:ss')).toBe('09:00:00');
  });
});
