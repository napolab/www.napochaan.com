import { describe, expect, it } from 'vitest';

import { nextIndex, shuffle } from './cycle';
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
