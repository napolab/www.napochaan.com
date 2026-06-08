import { describe, expect, it } from 'vitest';

import { toRfc822 } from '.';

describe('toRfc822', () => {
  it('formats an ISO date as RFC-822 in Asia/Tokyo (+0900)', () => {
    expect(toRfc822('2026-01-01')).toMatch(/^\w{3}, 01 Jan 2026 \d{2}:\d{2}:\d{2} \+0900$/);
  });

  it('renders the day-of-week and month abbreviations', () => {
    expect(toRfc822('2026-03-03T00:00:00.000Z')).toMatch(/^\w{3}, 03 Mar 2026 \d{2}:\d{2}:\d{2} [+-]\d{4}$/);
  });
});
