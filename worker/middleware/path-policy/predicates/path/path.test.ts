import { describe, expect, it } from 'vitest';

import { isDescendantOf, isExactPath, isWithinPath } from './index';

describe('isExactPath', () => {
  it('holds only for the identical path', () => {
    expect(isExactPath('/admin')('/admin')).toBe(true);
    expect(isExactPath('/admin')('/admin/')).toBe(false);
    expect(isExactPath('/admin')('/administrator')).toBe(false);
  });
});

describe('isWithinPath', () => {
  it.each(['/admin', '/admin/', '/admin/collections/blog/1'])('holds for %s', (pathname) => {
    expect(isWithinPath('/admin')(pathname)).toBe(true);
  });

  it.each(['/', '/administrator', '/adminx', '/api/admin'])('does not hold for %s', (pathname) => {
    expect(isWithinPath('/admin')(pathname)).toBe(false);
  });
});

describe('isDescendantOf', () => {
  it.each(['/admin/collections', '/admin//x', '/admin/%E0%A4%A'])('holds for %s', (pathname) => {
    expect(isDescendantOf('/admin')(pathname)).toBe(true);
  });

  it.each(['/admin', '/admin/', '/administrator/x', '/'])('does not hold for %s', (pathname) => {
    expect(isDescendantOf('/admin')(pathname)).toBe(false);
  });
});
