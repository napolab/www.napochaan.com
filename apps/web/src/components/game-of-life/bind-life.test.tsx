import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { bindLifeCanvas, startLifeLoop } from './bind-life';
import { createLifeEngine } from './engine';

import type { Resizer } from '@components/canvas-resize/container-resizer';

// Framework-free core of the GameOfLife canvas, shared by the React GameOfLife and the
// <game-of-life> element: sizing (re-seeds the engine only on a real grid change) and
// the 7fps rAF loop that ticks it.
const mountCanvas = () => {
  const canvas = document.createElement('canvas');
  document.body.appendChild(canvas);
  return canvas;
};

// A Resizer whose size and notifications the test controls.
const fakeResizer = (size: { width: number; height: number }) => {
  const observers = new Set<() => void>();
  const resizer: Resizer = {
    measure: () => size,
    observe: (_canvas, onResize) => {
      observers.add(onResize);
      return () => observers.delete(onResize);
    },
  };
  const notify = () => {
    for (const observer of observers) observer();
  };
  return { resizer, notify, observers };
};

const placeholder = () => createLifeEngine({ cols: 1, rows: 1, density: 0 });

afterEach(() => {
  document.body.replaceChildren();
});

describe('bindLifeCanvas', () => {
  it('sizes the canvas to its box and seeds the engine grid from it', () => {
    const engine = placeholder();
    const { resizer } = fakeResizer({ width: 240, height: 120 });
    const unbind = bindLifeCanvas({ canvas: mountCanvas(), engine, resizer });

    // CELL 24 → ceil(240/24)+1 × ceil(120/24)+1
    expect(engine.getState().cols).toBe(11);
    expect(engine.getState().rows).toBe(6);
    expect(engine.getState().alive).toBeGreaterThan(0);
    unbind();
  });

  // A ResizeObserver notification with an unchanged box (e.g. a transition:persist
  // move) must not re-seed: resize() zeroes the generation the SysBar shows.
  it('keeps the running simulation when a resize notification leaves the grid unchanged', () => {
    const engine = placeholder();
    const { resizer, notify } = fakeResizer({ width: 240, height: 120 });
    const unbind = bindLifeCanvas({ canvas: mountCanvas(), engine, resizer });
    engine.tick();
    engine.tick();

    notify();
    expect(engine.getState().generation).toBe(2);
    unbind();
  });

  it('re-seeds on a real grid change and stops observing once unbound', () => {
    const size = { width: 240, height: 120 };
    const engine = placeholder();
    const { resizer, notify, observers } = fakeResizer(size);
    const unbind = bindLifeCanvas({ canvas: mountCanvas(), engine, resizer });
    engine.tick();

    size.width = 480;
    notify();
    expect(engine.getState().cols).toBe(21);
    expect(engine.getState().generation).toBe(0);

    unbind();
    expect(observers.size).toBe(0);
  });
});

describe('startLifeLoop', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ticks the engine at ~7fps until stopped', () => {
    const engine = createLifeEngine({ cols: 8, rows: 8 });
    const stop = startLifeLoop({ canvas: mountCanvas(), engine });

    vi.advanceTimersByTime(1000);
    const ticked = engine.getState().generation;
    expect(ticked).toBeGreaterThanOrEqual(6);
    expect(ticked).toBeLessThanOrEqual(7);

    stop();
    vi.advanceTimersByTime(1000);
    expect(engine.getState().generation).toBe(ticked);
  });

  it('pauses while the tab is hidden', () => {
    const engine = createLifeEngine({ cols: 8, rows: 8 });
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    const stop = startLifeLoop({ canvas: mountCanvas(), engine });
    vi.advanceTimersByTime(16);
    document.dispatchEvent(new Event('visibilitychange'));
    const before = engine.getState().generation;

    vi.advanceTimersByTime(1000);
    expect(engine.getState().generation).toBe(before);

    hidden.mockReturnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(1000);
    expect(engine.getState().generation).toBeGreaterThan(before);
    stop();
    hidden.mockRestore();
  });
});
