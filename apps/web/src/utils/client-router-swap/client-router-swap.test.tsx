import { afterEach, describe, expect, it, vi } from 'vitest';

import { isSwapping, subscribeSwap } from './index';

const fire = (type: string) => document.dispatchEvent(new Event(type));

describe('client-router-swap', () => {
  afterEach(() => {
    // Leave the module state idle for the next test.
    fire('astro:page-load');
  });

  it('is idle before any navigation', () => {
    expect(isSwapping()).toBe(false);
  });

  it('is swapping from astro:before-swap until astro:page-load', () => {
    fire('astro:before-swap');
    expect(isSwapping()).toBe(true);
    fire('astro:after-swap');
    expect(isSwapping()).toBe(true);
    fire('astro:page-load');
    expect(isSwapping()).toBe(false);
  });

  it('notifies subscribers when the swap starts and when the new page has loaded', () => {
    const onChange = vi.fn();
    const unsubscribe = subscribeSwap(onChange);

    fire('astro:before-swap');
    expect(onChange).toHaveBeenCalledTimes(1);
    fire('astro:page-load');
    expect(onChange).toHaveBeenCalledTimes(2);

    unsubscribe();
    fire('astro:before-swap');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('does not notify on a page-load that ends no swap (the initial load)', () => {
    const onChange = vi.fn();
    const unsubscribe = subscribeSwap(onChange);

    fire('astro:page-load');
    expect(onChange).not.toHaveBeenCalled();
    unsubscribe();
  });
});
