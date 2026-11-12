import { describe, expect, it } from 'vitest';

import { defineCache } from './index';

describe('defineCache', () => {
  it('computes once per distinct argument tuple and returns the cached result', () => {
    const calls: number[] = [];
    const double = defineCache((n: number): number => {
      calls.push(n);

      return n * 2;
    });

    expect(double(2)).toBe(4);
    expect(double(2)).toBe(4);
    expect(calls).toEqual([2]); // computed once for 2

    expect(double(3)).toBe(6);
    expect(calls).toEqual([2, 3]);
  });

  it('distinguishes argument tuples', () => {
    const calls: string[] = [];
    const join = defineCache((a: string, b: string): string => {
      calls.push(`${a},${b}`);

      return `${a}-${b}`;
    });

    expect(join('x', 'y')).toBe('x-y');
    expect(join('y', 'x')).toBe('y-x');
    expect(calls).toEqual(['x,y', 'y,x']);
  });

  it('caches an undefined result (does not recompute)', () => {
    const calls: number[] = [];
    const fn = defineCache((n: number): undefined => {
      calls.push(n);

      return undefined;
    });

    fn(1);
    fn(1);
    expect(calls).toEqual([1]);
  });
});
