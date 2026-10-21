import { describe, expect, test } from 'vitest';

import { parseAudiences } from './index';

describe('parseAudiences', () => {
  test('splits on commas and trims whitespace', () => {
    expect(parseAudiences(' a , ,b ')).toEqual(['a', 'b']);
  });

  test.each([undefined, '', ' , '])('returns an empty list for %j', (raw) => {
    expect(parseAudiences(raw)).toEqual([]);
  });
});
