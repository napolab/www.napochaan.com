import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { smoothLag, startFrameLoop } from './frame-loop';

// gsap's ticker default lagSmoothing(500, 33): a frame gap over 500ms (tab hidden,
// main thread stalled) — or a clock that went backwards — advances time by 33ms only.
describe('smoothLag', () => {
  it('passes normal frame gaps through', () => {
    expect(smoothLag(16)).toBe(16);
    expect(smoothLag(500)).toBe(500);
  });

  it('treats a gap over 500ms as 33ms', () => {
    expect(smoothLag(501)).toBe(33);
    expect(smoothLag(60_000)).toBe(33);
  });

  it('treats a negative gap as 33ms', () => {
    expect(smoothLag(-1)).toBe(33);
  });
});

describe('startFrameLoop', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('calls back every frame with the ms elapsed since the previous frame', () => {
    const onFrame = vi.fn<(deltaMs: number) => void>();
    const start = performance.now();
    const stop = startFrameLoop(onFrame);

    vi.advanceTimersToNextFrame();
    const first = performance.now();
    vi.advanceTimersToNextFrame();
    vi.advanceTimersToNextFrame();

    expect(onFrame.mock.calls.map(([delta]) => delta)).toEqual([first - start, 16, 16]);
    stop();
  });

  it('lag-smooths a long gap between frames (hidden tab) to 33ms', () => {
    const onFrame = vi.fn<(deltaMs: number) => void>();
    const stop = startFrameLoop(onFrame);
    vi.advanceTimersToNextFrame();

    // the next frame lands 5s later
    vi.spyOn(performance, 'now').mockReturnValueOnce(performance.now() + 5016);
    vi.advanceTimersToNextFrame();

    expect(onFrame.mock.calls.at(-1)).toEqual([33]);
    stop();
  });

  it('stops requesting frames once stopped', () => {
    const onFrame = vi.fn<(deltaMs: number) => void>();
    const stop = startFrameLoop(onFrame);
    vi.advanceTimersToNextFrame();

    stop();
    vi.advanceTimersByTime(1000);

    expect(onFrame).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('can be stopped from inside its own callback', () => {
    const state: { stop: () => void } = { stop: () => undefined };
    const onFrame = vi.fn(() => state.stop());
    state.stop = startFrameLoop(onFrame);

    vi.advanceTimersByTime(1000);

    expect(onFrame).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});
