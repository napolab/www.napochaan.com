import { describe, expect, it } from 'vitest';

import { formatPostDate } from './index';

describe('formatPostDate', () => {
  it('formats an ISO date as YYYY.MM.DD', () => {
    expect(formatPostDate('2026-05-10')).toBe('2026.05.10');
  });
});
