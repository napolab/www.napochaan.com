import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getClock, subscribeClock } from './clock-store';

// Framework-free clock shared by the React useClock hook and the <sys-bar> element:
// one 1s interval while anyone listens, cleared when the last listener leaves.
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('clock store', () => {
  it('fills the live time synchronously on the first subscribe, then ticks every second', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeClock(listener);
    // 00:00:00Z is 09:00:00 in Asia/Tokyo.
    expect(getClock()).toBe('09:00:00');

    vi.advanceTimersByTime(1000);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(getClock()).toBe('09:00:01');
    unsubscribe();
  });

  it('shares one interval and stops ticking once the last listener leaves', () => {
    const a = vi.fn();
    const b = vi.fn();
    const offA = subscribeClock(a);
    const offB = subscribeClock(b);
    expect(vi.getTimerCount()).toBe(1);

    offA();
    expect(vi.getTimerCount()).toBe(1);
    offB();
    expect(vi.getTimerCount()).toBe(0);

    vi.advanceTimersByTime(3000);
    expect(a).not.toHaveBeenCalled();
    expect(b).not.toHaveBeenCalled();
  });
});
