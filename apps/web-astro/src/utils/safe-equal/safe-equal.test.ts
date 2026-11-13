import { describe, expect, it } from 'vitest';

import { matchesSecret, safeEqual } from '.';

describe('safeEqual', () => {
  it('holds for equal strings', () => {
    expect(safeEqual('s3cret', 's3cret')).toBe(true);
  });

  it('fails for different strings of the same length', () => {
    expect(safeEqual('s3cret', 's3creT')).toBe(false);
  });

  it.each([
    ['s3cret', 's3cret-longer'],
    ['s3cret-longer', 's3cret'],
    ['', 's3cret'],
  ])('fails for different lengths (%j vs %j)', (a, b) => {
    expect(safeEqual(a, b)).toBe(false);
  });
});

describe('matchesSecret', () => {
  it('holds when the submitted secret equals the configured one', () => {
    expect(matchesSecret('s3cret', 's3cret')).toBe(true);
  });

  it('fails for a different secret', () => {
    expect(matchesSecret('wrong!', 's3cret')).toBe(false);
  });

  it.each([undefined, ''])('fails when the configured secret is %j, even for an empty submission', (expected) => {
    expect(matchesSecret('', expected)).toBe(false);
    expect(matchesSecret(undefined, expected)).toBe(false);
  });

  it('fails when nothing was submitted', () => {
    expect(matchesSecret(undefined, 's3cret')).toBe(false);
  });
});
