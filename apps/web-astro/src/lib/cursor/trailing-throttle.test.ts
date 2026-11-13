import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTrailingThrottle } from './trailing-throttle';

describe('createTrailingThrottle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1000); // non-zero so the first push leads immediately (lastEmit starts at 0)
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('emits the first value immediately (leading edge)', () => {
    const seen: string[] = [];
    const t = createTrailingThrottle<string>(50, (v) => seen.push(v));

    t.push('a');

    expect(seen).toEqual(['a']);
  });

  it('collapses rapid pushes within the interval to a single trailing emit of the latest value', () => {
    const seen: string[] = [];
    const t = createTrailingThrottle<string>(50, (v) => seen.push(v));

    t.push('a'); // leading
    t.push('b'); // pending
    t.push('c'); // pending (latest)
    expect(seen).toEqual(['a']);

    vi.advanceTimersByTime(50);
    expect(seen).toEqual(['a', 'c']);
  });

  it('does not emit a trailing value after cancel()', () => {
    const seen: string[] = [];
    const t = createTrailingThrottle<string>(50, (v) => seen.push(v));

    t.push('a'); // leading
    t.push('b'); // pending trailing
    t.cancel();

    vi.advanceTimersByTime(100);
    expect(seen).toEqual(['a']);
  });
});
