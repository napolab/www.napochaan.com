import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';

import { SCROLL_RANGE_HOST_ATTRIBUTE } from './bind-scroll-range';
import { ScrollRangeSync } from './scroll-range-sync';

const Host = () => (
  <div {...{ [SCROLL_RANGE_HOST_ATTRIBUTE]: '' }} data-testid="host">
    <ScrollRangeSync />
  </div>
);

const hostDocHeight = (): string => document.querySelector<HTMLElement>('[data-testid="host"]')?.style.getPropertyValue('--doc-h') ?? '';

describe('ScrollRangeSync across ClientRouter swaps', () => {
  it('re-observes the new <body> after astro:after-swap (the persisted island outlives the old body)', async () => {
    const { container } = await render(<Host />);
    const original = document.body;
    const swapped = document.createElement('body');
    const filler = document.createElement('div');
    filler.style.height = '4321px';
    swapped.appendChild(filler);
    // Keep the rendered host connected while the body is replaced (the persisted tint
    // lives on <html> mid-swap).
    document.documentElement.appendChild(container);

    try {
      document.documentElement.replaceChild(swapped, original);
      document.dispatchEvent(new Event('astro:after-swap'));
      await expect.poll(hostDocHeight).toBe(`${swapped.offsetHeight}px`);

      // Growth of the NEW body must keep publishing (the observer moved with it).
      filler.style.height = '5000px';
      await expect.poll(hostDocHeight).toBe(`${swapped.offsetHeight}px`);
    } finally {
      document.documentElement.replaceChild(original, swapped);
      original.appendChild(container);
    }
  });
});
