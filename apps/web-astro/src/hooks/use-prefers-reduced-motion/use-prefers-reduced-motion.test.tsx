import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { usePrefersReducedMotion } from './index';

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

const Consumer = () => {
  const reduced = usePrefersReducedMotion();
  return <div data-testid="value">{`${reduced}`}</div>;
};

describe('usePrefersReducedMotion', () => {
  it('reflects the preference and updates live when the OS setting changes', async () => {
    const { mql, set } = makeMatchMedia();
    vi.spyOn(window, 'matchMedia').mockReturnValue(mql);

    render(<Consumer />);
    await expect.element(page.getByTestId('value')).toHaveTextContent('false');

    set(true);
    await expect.element(page.getByTestId('value')).toHaveTextContent('true');

    vi.restoreAllMocks();
  });
});
