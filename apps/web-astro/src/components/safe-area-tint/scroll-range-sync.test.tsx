import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';

import { ScrollRangeSync } from './scroll-range-sync';

const docHeight = (): string => document.documentElement.style.getPropertyValue('--doc-h');

describe('ScrollRangeSync across ClientRouter swaps', () => {
  it('re-observes the new <body> after astro:after-swap (the persisted island outlives the old body)', async () => {
    await render(<ScrollRangeSync />);
    const original = document.body;
    const swapped = document.createElement('body');
    const filler = document.createElement('div');
    filler.style.height = '4321px';
    swapped.appendChild(filler);

    try {
      document.documentElement.replaceChild(swapped, original);
      document.dispatchEvent(new Event('astro:after-swap'));
      await expect.poll(docHeight).toBe(`${swapped.offsetHeight}px`);

      // Growth of the NEW body must keep publishing (the observer moved with it).
      filler.style.height = '5000px';
      await expect.poll(docHeight).toBe(`${swapped.offsetHeight}px`);
    } finally {
      document.documentElement.replaceChild(original, swapped);
    }
  });
});
