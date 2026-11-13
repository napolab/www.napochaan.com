import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SCROLL_RANGE_SYNC_TAG, defineScrollRangeSyncElement } from './element';

const docHeight = (): string => document.documentElement.style.getPropertyValue('--doc-h');

const mount = () => {
  const element = document.createElement(SCROLL_RANGE_SYNC_TAG);
  document.body.appendChild(element);
  return element;
};

describe('<scroll-range-sync>', () => {
  beforeEach(() => {
    defineScrollRangeSyncElement();
    document.documentElement.style.removeProperty('--doc-h');
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('publishes the scroll range, viewport and document heights onto <html> on connect', () => {
    mount();
    const root = document.documentElement.style;
    expect(root.getPropertyValue('--viewport-h')).toBe(`${window.innerHeight}px`);
    expect(docHeight()).toBe(`${document.body.offsetHeight}px`);
    expect(root.getPropertyValue('--scroll-range')).toBe(`${Math.max(0, document.body.offsetHeight - window.innerHeight)}px`);
  });

  it('re-publishes when the body grows', async () => {
    mount();
    const filler = document.createElement('div');
    filler.style.height = '3456px';
    document.body.appendChild(filler);
    await expect.poll(docHeight).toBe(`${document.body.offsetHeight}px`);
  });

  it('re-observes the new <body> after astro:after-swap (the persisted tint outlives the old body)', async () => {
    // Parked on <html> (where the swap lifts persisted nodes), so it stays connected
    // while the body is replaced.
    const element = document.createElement(SCROLL_RANGE_SYNC_TAG);
    document.documentElement.appendChild(element);
    const original = document.body;
    const swapped = document.createElement('body');
    const filler = document.createElement('div');
    filler.style.height = '4321px';
    swapped.appendChild(filler);

    try {
      document.documentElement.replaceChild(swapped, original);
      document.dispatchEvent(new Event('astro:after-swap'));
      await expect.poll(docHeight).toBe(`${swapped.offsetHeight}px`);

      filler.style.height = '5000px';
      await expect.poll(docHeight).toBe(`${swapped.offsetHeight}px`);
    } finally {
      document.documentElement.replaceChild(original, swapped);
      element.remove();
    }
  });

  it('stops publishing once disconnected', async () => {
    const element = mount();
    element.remove();
    const before = docHeight();
    const filler = document.createElement('div');
    filler.style.height = '2345px';
    document.body.appendChild(filler);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(docHeight()).toBe(before);
  });
});
