import { describe, expect, it } from 'vitest';

import { safeDecodePathname } from './safe-decode-pathname';

describe('safeDecodePathname', () => {
  it.each([
    ['/%61dmin/collections', '/admin/collections'],
    ['/admin%2Fcollections', '/admin/collections'],
    ['/admin', '/admin'],
  ])('decodes %s to %s', (pathname, expected) => {
    expect(safeDecodePathname(pathname)).toBe(expected);
  });

  it('returns the raw pathname for malformed percent-encoding instead of throwing', () => {
    expect(safeDecodePathname('/admin/%E0%A4%A')).toBe('/admin/%E0%A4%A');
  });
});
