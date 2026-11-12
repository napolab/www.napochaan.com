import { afterEach, describe, expect, it, vi } from 'vitest';

import { pointerFine } from './index';

const stubMatchMedia = (matches: boolean): void => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }));
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('pointerFine', () => {
  it('is true when (pointer: fine) matches', () => {
    stubMatchMedia(true);
    expect(pointerFine()).toBe(true);
  });

  it('is false when it does not match', () => {
    stubMatchMedia(false);
    expect(pointerFine()).toBe(false);
  });
});
