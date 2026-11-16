import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SCROLL_RANGE_HOST_ATTRIBUTE } from './bind-scroll-range';
import { SCROLL_RANGE_SYNC_TAG, defineScrollRangeSyncElement } from './element';

// The tint root (marked with the host attribute) owns the published variables: only
// its strips consume them, so writing them on <html> restyled the whole document.
const mount = () => {
  const host = document.createElement('div');
  host.setAttribute(SCROLL_RANGE_HOST_ATTRIBUTE, '');
  const element = document.createElement(SCROLL_RANGE_SYNC_TAG);
  host.appendChild(element);
  document.body.appendChild(host);
  return { host, element };
};

const varOf = (host: HTMLElement, name: string): string => host.style.getPropertyValue(name);

describe('<scroll-range-sync>', () => {
  beforeEach(() => {
    defineScrollRangeSyncElement();
    for (const name of ['--doc-h', '--viewport-h', '--scroll-range']) document.documentElement.style.removeProperty(name);
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('publishes the scroll range, viewport and document heights onto the tint root', async () => {
    const { host } = mount();
    await expect.poll(() => varOf(host, '--doc-h')).toBe(`${document.body.offsetHeight}px`);
    expect(varOf(host, '--viewport-h')).toBe(`${window.innerHeight}px`);
    expect(varOf(host, '--scroll-range')).toBe(`${Math.max(0, document.body.offsetHeight - window.innerHeight)}px`);
  });

  it('never writes the variables onto <html>', async () => {
    const { host } = mount();
    await expect.poll(() => varOf(host, '--doc-h')).not.toBe('');
    const root = document.documentElement.style;
    expect([root.getPropertyValue('--doc-h'), root.getPropertyValue('--viewport-h'), root.getPropertyValue('--scroll-range')]).toEqual(['', '', '']);
  });

  it('reads no layout synchronously on connect (the first ResizeObserver entry measures)', () => {
    const offsetHeight = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get');
    const innerHeight = vi.spyOn(window, 'innerHeight', 'get');
    try {
      const { host } = mount();
      expect(offsetHeight).not.toHaveBeenCalled();
      expect(innerHeight).not.toHaveBeenCalled();
      expect(varOf(host, '--doc-h')).toBe('');
    } finally {
      offsetHeight.mockRestore();
      innerHeight.mockRestore();
    }
  });

  it('skips the style writes when nothing changed', async () => {
    const { host } = mount();
    await expect.poll(() => varOf(host, '--doc-h')).not.toBe('');
    const setProperty = vi.spyOn(host.style, 'setProperty');
    try {
      window.dispatchEvent(new Event('resize'));
      expect(setProperty).not.toHaveBeenCalled();
    } finally {
      setProperty.mockRestore();
    }
  });

  it('re-publishes when the body grows', async () => {
    const { host } = mount();
    const filler = document.createElement('div');
    filler.style.height = '3456px';
    document.body.appendChild(filler);
    await expect.poll(() => varOf(host, '--doc-h')).toBe(`${document.body.offsetHeight}px`);
  });

  it('re-observes the new <body> after astro:after-swap (the persisted tint outlives the old body)', async () => {
    // Parked on <html> (where the swap lifts persisted nodes), so it stays connected
    // while the body is replaced.
    const host = document.createElement('div');
    host.setAttribute(SCROLL_RANGE_HOST_ATTRIBUTE, '');
    host.appendChild(document.createElement(SCROLL_RANGE_SYNC_TAG));
    document.documentElement.appendChild(host);
    const original = document.body;
    const swapped = document.createElement('body');
    const filler = document.createElement('div');
    filler.style.height = '4321px';
    swapped.appendChild(filler);

    try {
      document.documentElement.replaceChild(swapped, original);
      document.dispatchEvent(new Event('astro:after-swap'));
      await expect.poll(() => varOf(host, '--doc-h')).toBe(`${swapped.offsetHeight}px`);

      filler.style.height = '5000px';
      await expect.poll(() => varOf(host, '--doc-h')).toBe(`${swapped.offsetHeight}px`);
    } finally {
      document.documentElement.replaceChild(original, swapped);
      host.remove();
    }
  });

  it('stops publishing once disconnected', async () => {
    const { host, element } = mount();
    await expect.poll(() => varOf(host, '--doc-h')).not.toBe('');
    element.remove();
    const before = varOf(host, '--doc-h');
    const filler = document.createElement('div');
    filler.style.height = '2345px';
    document.body.appendChild(filler);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(varOf(host, '--doc-h')).toBe(before);
  });
});
