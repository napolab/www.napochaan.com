import { describe, expect, it } from 'vitest';

import { phrase } from './index';

describe('phrase', () => {
  it('segments Japanese prose into 文節 chunks', () => {
    expect(phrase('今日は天気です。')).toEqual(['今日は', '天気です。']);
  });

  it('returns the whole string as a single chunk when there is no boundary', () => {
    expect(phrase('猫')).toEqual(['猫']);
  });

  it('returns an empty array for empty input', () => {
    expect(phrase('')).toEqual([]);
  });
});
