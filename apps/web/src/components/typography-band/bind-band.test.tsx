import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { bindBand } from './bind-band';

import type { BandTracks } from './bind-band';

// bindBand drives the band with plain rAF + scroll listeners (no gsap). Everything runs
// on one fake clock (rAF fires every 16ms, performance.now / timers follow it), scrollY
// is a stub and `scroll` events are dispatched by hand, so every frame is deterministic.
const FRAME_MS = 1000 / 60;
const BASE_DRIFT = 0.35;
const VELOCITY_SCALE = 0.04;

const scroll = { y: 0 };
const writes: { y: number; time: number }[] = [];

// Tracks whose duplicated halves measure `half` px (scrollWidth / scrollHeight = 2·half).
const mountTracks = (half: number): BandTracks => {
  const track = (vertical: boolean) => {
    const element = document.createElement('div');
    element.style.display = 'flex';
    element.style.flexDirection = vertical ? 'column' : 'row';
    element.style.width = 'max-content'; // scrollWidth = the two halves, not the viewport
    for (const _ of [0, 1]) {
      const span = document.createElement('span');
      span.style.flexShrink = '0';
      span.style.width = vertical ? '10px' : `${half}px`;
      span.style.height = vertical ? `${half}px` : '10px';
      element.appendChild(span);
    }
    document.body.appendChild(element);
    return element;
  };

  return { top: track(false), bottom: track(false), left: track(true), right: track(true) };
};

const translate = (element: HTMLElement) => {
  const match = /^translate\((-?[\d.e-]+)px, (-?[\d.e-]+)px\)$/.exec(element.style.transform);
  if (match === null) throw new Error(`unexpected transform: "${element.style.transform}"`);
  const [, x = '', y = ''] = match;
  return { x: parseFloat(x), y: parseFloat(y) };
};

const scrollTo = (y: number) => {
  scroll.y = y;
  window.dispatchEvent(new Event('scroll'));
};

const restOffGrid = () => {
  scrollTo(1013); // 1013 → nearest 24px multiple is 1008
  vi.advanceTimersByTime(140); // SNAP_DELAY elapsed: the tween starts now
  return performance.now();
};

const power2Out = (progress: number) => 1 - (1 - progress) ** 2;

beforeEach(() => {
  vi.useFakeTimers({
    toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
  });
  scroll.y = 0;
  writes.length = 0;
  vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => scroll.y);
  vi.spyOn(window, 'scrollX', 'get').mockImplementation(() => 0);
  vi.spyOn(window, 'scrollTo').mockImplementation((_x: number, y: number) => {
    writes.push({ y, time: performance.now() });
    scroll.y = y;
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe('bindBand drift', () => {
  it('advances the tracks clockwise by the base drift per 60fps frame, as gsap.set did', () => {
    const tracks = mountTracks(1000);
    const dispose = bindBand(tracks);

    vi.advanceTimersByTime(1000);
    const drift = BASE_DRIFT * (1000 / FRAME_MS); // ≈ 21px

    // top ← / bottom → / left ↓ / right ↑ (each wrapped into (-half, 0])
    expect(translate(tracks.top).x).toBeCloseTo(-drift, 0);
    expect(translate(tracks.top).y).toBe(0);
    expect(translate(tracks.bottom).x).toBeCloseTo(drift - 1000, 0);
    expect(translate(tracks.left).y).toBeCloseTo(drift - 1000, 0);
    expect(translate(tracks.left).x).toBe(0);
    expect(translate(tracks.right).y).toBeCloseTo(-drift, 0);
    dispose();
  });

  it('writes 2D translate() with px units rounded like gsap (4 decimals)', () => {
    const tracks = mountTracks(1000);
    const dispose = bindBand(tracks);

    vi.advanceTimersByTime(100);

    expect(tracks.top.style.transform).toMatch(/^translate\(-\d+(\.\d{1,4})?px, 0px\)$/);
    expect(tracks.left.style.transform).toMatch(/^translate\(0px, -\d+(\.\d{1,4})?px\)$/);
    dispose();
  });

  it('wraps seamlessly at half the duplicated track', () => {
    const tracks = mountTracks(100);
    const dispose = bindBand(tracks);

    vi.advanceTimersByTime(6000);
    const drift = BASE_DRIFT * (6000 / FRAME_MS); // ≈ 126px → one wrap

    expect(translate(tracks.top).x).toBeCloseTo(-(drift - 100), 0);
    expect(translate(tracks.bottom).x).toBeCloseTo(drift - 200, 0);
    dispose();
  });
});

describe('bindBand velocity boost', () => {
  const HALF = 10_000;
  // A one-frame move across the wrap boundary reads as ±HALF: fold it back.
  const unwrap = (delta: number) => {
    if (delta > HALF / 2) return delta - HALF;
    if (delta < -HALF / 2) return delta + HALF;
    return delta;
  };
  // Steps to the next frame and returns how far the top track moved left on it.
  const topStep = (tracks: BandTracks) => {
    const before = translate(tracks.top).x;
    vi.advanceTimersToNextFrame();
    return unwrap(before - translate(tracks.top).x);
  };

  it('scales a downward scroll velocity (px/s) into a forward boost', () => {
    const tracks = mountTracks(HALF);
    const start = performance.now();
    const dispose = bindBand(tracks);
    for (const _ of [0, 1, 2, 3, 4, 5]) vi.advanceTimersToNextFrame();

    scrollTo(100);
    const velocity = (100 / (performance.now() - start)) * 1000;
    const boost = velocity * VELOCITY_SCALE;

    expect(topStep(tracks)).toBeCloseTo((BASE_DRIFT + boost) * (16 / FRAME_MS), 3);
    // decays by VEL_DECAY (0.9) per frame back toward the base drift
    expect(topStep(tracks)).toBeCloseTo((BASE_DRIFT + boost * 0.9) * (16 / FRAME_MS), 3);
    dispose();
  });

  it('reverses the drift while scrolling up', () => {
    scroll.y = 1000;
    const tracks = mountTracks(HALF);
    const dispose = bindBand(tracks);
    for (const _ of [0, 1, 2, 3, 4, 5]) vi.advanceTimersToNextFrame();

    scrollTo(900);

    expect(topStep(tracks)).toBeLessThan(-10);
    dispose();
  });

  it('ignores a scroll event that did not change the position', () => {
    const tracks = mountTracks(HALF);
    const dispose = bindBand(tracks);
    for (const _ of [0, 1, 2, 3, 4, 5]) vi.advanceTimersToNextFrame();

    scrollTo(0);

    expect(topStep(tracks)).toBeCloseTo(BASE_DRIFT * (16 / FRAME_MS), 5);
    dispose();
  });

  // ScrollTrigger re-samples the idle position every 250ms (its _sync interval), so the
  // first scroll after a long rest is measured over the last ~250ms, not since bind.
  it('measures the first scroll after a rest against a recent idle sample', () => {
    const tracks = mountTracks(HALF);
    const dispose = bindBand(tracks);
    vi.advanceTimersByTime(2000);

    scrollTo(60);

    // measured since bind it would be 60px / 2s = 30px/s → step ≈ 1.5px
    expect(topStep(tracks)).toBeGreaterThan(5);
    dispose();
  });
});

describe('bindBand grid snap', () => {
  it('tweens the scroll onto the 24px grid with power2.out over 0.3s', () => {
    const dispose = bindBand(mountTracks(1000));
    const start = restOffGrid();

    vi.advanceTimersByTime(1000);

    expect(writes.length).toBeGreaterThan(10);
    for (const { y, time } of writes) {
      const progress = Math.min(1, (time - start) / 300);
      expect(y).toBeCloseTo(1013 + (1008 - 1013) * power2Out(progress), 6);
    }
    expect(writes.at(-1)?.y).toBe(1008);
    dispose();
  });

  it('waits SNAP_DELAY after the LAST scroll event', () => {
    const dispose = bindBand(mountTracks(1000));
    scrollTo(1013);
    vi.advanceTimersByTime(100);
    scrollTo(1014);

    vi.advanceTimersByTime(130);
    expect(writes).toHaveLength(0);

    vi.advanceTimersByTime(60);
    expect(writes.length).toBeGreaterThan(0);
    dispose();
  });

  it('does nothing within ±0.5px of the grid', () => {
    const dispose = bindBand(mountTracks(1000));
    scrollTo(1008.4);

    vi.advanceTimersByTime(1000);

    expect(writes).toHaveLength(0);
    dispose();
  });

  it.each([
    { name: 'wheel', fire: () => window.dispatchEvent(new Event('wheel')) },
    { name: 'touchstart', fire: () => window.dispatchEvent(new Event('touchstart')) },
    { name: 'keydown', fire: () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' })) },
    { name: 'astro:before-swap', fire: () => document.dispatchEvent(new Event('astro:before-swap')) },
  ])('is cancelled mid-tween by $name', ({ fire }) => {
    const dispose = bindBand(mountTracks(1000));
    restOffGrid();
    vi.advanceTimersByTime(50);
    const written = writes.length;
    expect(written).toBeGreaterThan(0);

    fire();
    vi.advanceTimersByTime(1000);

    expect(writes).toHaveLength(written);
    expect(scroll.y).not.toBe(1008);
    dispose();
  });

  it('is cancelled by user input before it starts', () => {
    const dispose = bindBand(mountTracks(1000));
    scrollTo(1013);
    vi.advanceTimersByTime(100);

    window.dispatchEvent(new Event('wheel'));
    vi.advanceTimersByTime(1000);

    expect(writes).toHaveLength(0);
    dispose();
  });
});

describe('bindBand dispose', () => {
  it('stops the drift loop and leaves no frame, timer or interval behind', () => {
    const tracks = mountTracks(1000);
    const dispose = bindBand(tracks);
    vi.advanceTimersByTime(100);

    dispose();
    const transform = tracks.top.style.transform;
    vi.advanceTimersByTime(1000);

    expect(tracks.top.style.transform).toBe(transform);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cancels an in-flight snap and stops listening for scroll', () => {
    const dispose = bindBand(mountTracks(1000));
    restOffGrid();
    vi.advanceTimersByTime(50);

    dispose();
    const written = writes.length;
    scrollTo(2013);
    vi.advanceTimersByTime(1000);

    expect(writes).toHaveLength(written);
    expect(vi.getTimerCount()).toBe(0);
  });
});
