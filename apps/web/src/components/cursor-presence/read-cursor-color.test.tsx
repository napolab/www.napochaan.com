import { afterEach, describe, expect, it, vi } from 'vitest';

import { createCursorColorReader } from './read-cursor-color';

const root = document.documentElement.style;

afterEach(() => {
  root.removeProperty('--colors-cursor-blue');
  root.removeProperty('--colors-cursor-red');
  vi.restoreAllMocks();
});

describe('createCursorColorReader', () => {
  it('resolves a cursor color token to its computed value', () => {
    root.setProperty('--colors-cursor-blue', '#1a34ff');
    expect(createCursorColorReader()('blue')).toBe('#1a34ff');
  });

  it('falls back to near-black when the token is missing', () => {
    expect(createCursorColorReader()('teal')).toBe('#111111');
  });

  // getComputedStyle on <html> flushes a full-document style recalc whenever style is
  // dirty. The palette is read in one pass on first use, never once per color.
  it('reads the computed style once for the whole palette', () => {
    root.setProperty('--colors-cursor-blue', '#1a34ff');
    root.setProperty('--colors-cursor-red', '#ff002b');
    const spy = vi.spyOn(window, 'getComputedStyle');
    const read = createCursorColorReader();

    expect([read('blue'), read('red'), read('blue'), read('green')]).toEqual(['#1a34ff', '#ff002b', '#1a34ff', '#111111']);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('does not touch the computed style until a color is first needed', () => {
    const spy = vi.spyOn(window, 'getComputedStyle');
    createCursorColorReader();
    expect(spy).not.toHaveBeenCalled();
  });
});
