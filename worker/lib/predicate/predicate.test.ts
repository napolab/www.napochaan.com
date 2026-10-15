import { describe, expect, it, vi } from 'vitest';

import { allOf, anyOf, equals, isIn, not, on } from './index';

import type { Predicate } from './index';

const yes: Predicate<number> = () => true;
const no: Predicate<number> = () => false;

describe('allOf', () => {
  it('holds when every predicate holds', () => {
    expect(allOf(yes, yes)(0)).toBe(true);
  });

  it('fails when any predicate fails', () => {
    expect(allOf(yes, no, yes)(0)).toBe(false);
  });

  it('holds vacuously for no predicates', () => {
    expect(allOf<number>()(0)).toBe(true);
  });

  it('short-circuits after the first failure', () => {
    const later = vi.fn(yes);

    allOf(no, later)(0);

    expect(later).not.toHaveBeenCalled();
  });
});

describe('anyOf', () => {
  it('holds when any predicate holds', () => {
    expect(anyOf(no, yes)(0)).toBe(true);
  });

  it('fails when every predicate fails', () => {
    expect(anyOf(no, no)(0)).toBe(false);
  });

  it('fails for no predicates', () => {
    expect(anyOf<number>()(0)).toBe(false);
  });

  it('short-circuits after the first success', () => {
    const later = vi.fn(yes);

    anyOf(yes, later)(0);

    expect(later).not.toHaveBeenCalled();
  });
});

describe('not', () => {
  it('inverts a predicate', () => {
    expect(not(yes)(0)).toBe(false);
    expect(not(no)(0)).toBe(true);
  });
});

describe('on', () => {
  it('applies the predicate to the selected part', () => {
    const isEven: Predicate<number> = (n) => n % 2 === 0;

    expect(on((s: string) => s.length, isEven)('ab')).toBe(true);
    expect(on((s: string) => s.length, isEven)('abc')).toBe(false);
  });
});

describe('equals', () => {
  it('holds only for the expected value', () => {
    expect(equals('a')('a')).toBe(true);
    expect(equals('a')('b')).toBe(false);
  });

  it('compares with strict equality', () => {
    expect(equals<string | null>('a')(null)).toBe(false);
  });
});

describe('isIn', () => {
  it('holds for members only', () => {
    expect(isIn(['GET', 'HEAD'])('HEAD')).toBe(true);
    expect(isIn(['GET', 'HEAD'])('POST')).toBe(false);
  });
});
