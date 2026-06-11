import { describe, expect, it } from 'vitest';

import { isExternal } from './index';

describe('isExternal', () => {
  it('treats absolute http(s) URLs as external', () => {
    expect(isExternal('http://example.com')).toBe(true);
    expect(isExternal('https://example.com/path')).toBe(true);
  });

  it('treats root-relative routes as internal', () => {
    expect(isExternal('/news/1')).toBe(false);
    expect(isExternal('/')).toBe(false);
  });

  it('treats fragments and non-http schemes as internal', () => {
    expect(isExternal('#anchor')).toBe(false);
    expect(isExternal('mailto:a@b.com')).toBe(false);
    expect(isExternal('tel:09000000000')).toBe(false);
  });
});
