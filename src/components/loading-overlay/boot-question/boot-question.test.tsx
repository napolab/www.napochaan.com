import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';

import { BootQuestion, nextIndex, shuffle } from './index';
import { QUESTIONS } from '../questions';

// Deterministic stand-in for Math.random: yields the queued values in order,
// then 0. Mutable cursor lives in a const object (no `let`), matching the
// controller pattern used elsewhere in this folder.
const seq = (values: readonly number[]) => {
  const cursor = { i: 0 };
  return () => {
    const value = values[cursor.i] ?? 0;
    cursor.i += 1;
    return value;
  };
};

describe('nextIndex', () => {
  it('advances by one and wraps back to zero past the last prompt', () => {
    expect(nextIndex(0, QUESTIONS.length)).toBe(1);
    expect(nextIndex(3, QUESTIONS.length)).toBe(4);
    expect(nextIndex(QUESTIONS.length - 1, QUESTIONS.length)).toBe(0);
  });
});

describe('shuffle', () => {
  it('orders elements by their drawn key (ascending)', () => {
    // Keys are drawn per element in order: a=0.9, b=0.5, c=0.1 → sorted [c, b, a].
    expect(shuffle(['a', 'b', 'c'], seq([0.9, 0.5, 0.1]))).toEqual(['c', 'b', 'a']);
  });

  it('preserves every element — no loss, no duplication', () => {
    const result = shuffle(QUESTIONS, seq([0.3, 0.1, 0.4, 0.15, 0.9]));
    expect([...result].sort()).toStrictEqual([...QUESTIONS].sort());
  });

  it('never mutates the input array', () => {
    const input = ['a', 'b', 'c'];
    const snapshot = [...input];
    shuffle(input, seq([0.9, 0.5, 0.1]));
    expect(input).toStrictEqual(snapshot);
  });
});

describe('BootQuestion', () => {
  it('shows a prompt in full when motion is reduced (no cycling)', async () => {
    // Reduced motion makes the hook jump straight to the full text and the cycle
    // holds on the first shuffled prompt. Pinning Math.random to a constant gives
    // every element an equal sort key, so the stable sort leaves the order
    // untouched — the first prompt shown is QUESTIONS[0], keeping this assertion
    // deterministic while the shuffle still runs.
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    });

    const screen = await render(<BootQuestion />);
    const [first] = QUESTIONS;
    await expect.element(screen.getByText(first)).toBeInTheDocument();

    vi.restoreAllMocks();
  });
});
