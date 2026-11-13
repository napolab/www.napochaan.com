import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { write } from '@utils/persistent-store';
import { MOTION_STORAGE_KEY } from '@utils/prefers-reduced-motion';

import { GAME_OF_LIFE_TAG, defineGameOfLifeElement } from './element';
import { sharedLifeEngine } from './shared-engine';

// The markup game-of-life.astro renders, inside a sized box (the life frame / demo cell).
// The inline canvas sizing stands in for the panda class the .astro sets.
const mount = (attributes = '') => {
  const container = document.createElement('div');
  container.style.cssText = 'width: 240px; height: 120px;';
  container.innerHTML = `<${GAME_OF_LIFE_TAG} ${attributes}><canvas data-testid="game-of-life" aria-hidden="true" style="display: block; width: 100%; height: 100%;"></canvas></${GAME_OF_LIFE_TAG}>`;
  document.body.appendChild(container);
  const element = container.querySelector(GAME_OF_LIFE_TAG);
  const canvas = container.querySelector('canvas');
  if (element === null || canvas === null) throw new Error('not rendered');
  return { container, element, canvas };
};

// The element binds in a microtask after connect (persist reconcile).
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const generation = () => sharedLifeEngine.getState().generation;
const frames = (ms: number) => vi.advanceTimersByTime(ms);
const pixels = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d');
  if (ctx === null) throw new Error('no 2d context');
  return ctx.getImageData(0, 0, canvas.width, canvas.height).data.join(',');
};

describe('<game-of-life>', () => {
  beforeEach(() => {
    defineGameOfLifeElement();
    write(MOTION_STORAGE_KEY, null);
    // Deterministic frames; setTimeout stays real so settle() can await the microtask.
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  });

  afterEach(async () => {
    document.body.replaceChildren();
    await settle();
    vi.useRealTimers();
    vi.restoreAllMocks();
    write(MOTION_STORAGE_KEY, null);
  });

  it('registers once (re-running the bundled script is a no-op)', () => {
    expect(() => defineGameOfLifeElement()).not.toThrow();
    expect(customElements.get(GAME_OF_LIFE_TAG)).toBeDefined();
  });

  it('seeds the shared engine from its box and ticks it at ~7fps', async () => {
    mount();
    await settle();
    expect(sharedLifeEngine.getState().cols).toBe(11);
    expect(sharedLifeEngine.getState().rows).toBe(6);
    const before = generation();

    frames(1000);
    expect(generation() - before).toBeGreaterThanOrEqual(6);
    expect(generation() - before).toBeLessThanOrEqual(7);
  });

  // The colophon demo: its own engine, so the background's gen count never moves.
  it('runs an isolated engine with engine="isolated"', async () => {
    const { canvas } = mount('engine="isolated"');
    await settle();
    const before = generation();
    const first = pixels(canvas);

    frames(1000);
    expect(generation()).toBe(before);
    expect(pixels(canvas)).not.toBe(first);
  });

  it('draws the static grid but runs no loop while reduced motion is on, and starts once it is turned off', async () => {
    write(MOTION_STORAGE_KEY, false);
    const { canvas } = mount();
    await settle();
    const before = generation();
    expect(canvas.width).toBeGreaterThan(0);

    frames(1000);
    expect(generation()).toBe(before);

    write(MOTION_STORAGE_KEY, true);
    frames(1000);
    expect(generation()).toBeGreaterThan(before);
  });

  it('stops the loop when reduced motion is turned on', async () => {
    mount();
    await settle();
    write(MOTION_STORAGE_KEY, false);
    const before = generation();

    frames(1000);
    expect(generation()).toBe(before);
  });

  // transition:persist moves the life frame (to <html>, then into the new body): each
  // move is a synchronous disconnect + connect. The simulation must keep counting from
  // where it was — no re-seed (gen back to 0), no second loop, no second observer.
  it('survives a synchronous persist move without re-seeding or doubling the loop', async () => {
    const observe = vi.spyOn(ResizeObserver.prototype, 'observe');
    const { container } = mount();
    await settle();
    frames(500);
    const before = generation();
    expect(before).toBeGreaterThan(0);

    document.documentElement.appendChild(container);
    document.body.appendChild(container);
    await settle();
    frames(1000);

    expect(generation()).toBeGreaterThan(before);
    expect(generation() - before).toBeLessThanOrEqual(7);
    expect(observe).toHaveBeenCalledTimes(1);
  });

  it('stops its loop when it is really removed', async () => {
    const { element } = mount();
    await settle();
    element.remove();
    await settle();
    const before = generation();

    frames(1000);
    expect(generation()).toBe(before);
  });

  // The swap briefly connects the incoming page's own life frame before the persisted
  // one replaces it: that transient element must bind nothing.
  it('binds nothing for an element connected and removed in the same task', async () => {
    const observe = vi.spyOn(ResizeObserver.prototype, 'observe');
    const { element } = mount();
    element.remove();
    await settle();
    const before = generation();

    frames(1000);
    expect(observe).not.toHaveBeenCalled();
    expect(generation()).toBe(before);
  });
});
