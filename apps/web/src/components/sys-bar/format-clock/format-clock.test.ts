import { describe, expect, it } from 'vitest';

import { formatClock } from './index';

describe('formatClock', () => {
  it('formats the current Asia/Tokyo time as HH:mm:ss', () => {
    expect(formatClock()).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });
});
