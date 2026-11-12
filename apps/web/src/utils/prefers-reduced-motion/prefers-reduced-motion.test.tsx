import { describe, expect, it, vi } from 'vitest';

import { prefersReducedMotion, resolveReducedMotion } from './index';

// A controllable MediaQueryList stand-in: flip `matches` via `set` and it notifies
// every subscribed listener, mimicking an OS reduced-motion toggle. No `let` (const
// object holds the mutable cells) to satisfy the project's immutability lint.
const makeMatchMedia = () => {
  const state = { matches: false, listeners: new Set<() => void>() };
  const mql = {
    get matches() {
      return state.matches;
    },
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: (_type: string, cb: () => void) => {
      state.listeners.add(cb);
    },
    removeEventListener: (_type: string, cb: () => void) => {
      state.listeners.delete(cb);
    },
    addListener: (cb: () => void) => {
      state.listeners.add(cb);
    },
    removeListener: (cb: () => void) => {
      state.listeners.delete(cb);
    },
    dispatchEvent: () => false,
  };
  const set = (next: boolean) => {
    state.matches = next;
    for (const listener of state.listeners) listener();
  };

  return { mql: mql as unknown as MediaQueryList, set };
};

describe('resolveReducedMotion', () => {
  it('follows the OS value when there is no user override', () => {
    expect(resolveReducedMotion(null, true)).toBe(true);
    expect(resolveReducedMotion(null, false)).toBe(false);
  });

  it('lets an explicit user override win over the OS value', () => {
    // override is "motion enabled": true → motion on → not reduced; false → reduced.
    expect(resolveReducedMotion(true, true)).toBe(false);
    expect(resolveReducedMotion(false, false)).toBe(true);
  });
});

describe('prefersReducedMotion', () => {
  it('reads the current reduce media query match', () => {
    const { mql } = makeMatchMedia();
    vi.spyOn(window, 'matchMedia').mockReturnValue(mql);
    expect(prefersReducedMotion()).toBe(false);
    vi.restoreAllMocks();
  });

  it('reflects a true match', () => {
    const { mql, set } = makeMatchMedia();
    vi.spyOn(window, 'matchMedia').mockReturnValue(mql);
    set(true);
    expect(prefersReducedMotion()).toBe(true);
    vi.restoreAllMocks();
  });
});
