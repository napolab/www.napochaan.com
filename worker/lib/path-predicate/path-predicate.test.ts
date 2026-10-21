import { describe, expect, it } from 'vitest';

import { hasPrefix, hasSuffix, isDescendantOf, isExactPath, isWithinPath } from './index';

describe('hasPrefix', () => {
  it('holds when the pathname starts with the prefix', () => {
    expect(hasPrefix('/api/')('/api/users')).toBe(true);
    expect(hasPrefix('/api/')('/api/')).toBe(true);
  });

  it('does not hold otherwise', () => {
    expect(hasPrefix('/api/')('/api')).toBe(false);
    expect(hasPrefix('/api/')('/x/api/')).toBe(false);
  });

  it('compares the raw pathname without decoding', () => {
    expect(hasPrefix('/api/')('/%61pi/x')).toBe(false);
  });
});

describe('hasSuffix', () => {
  it('holds when the pathname ends with the suffix', () => {
    expect(hasSuffix('.md')('/about.md')).toBe(true);
    expect(hasSuffix('/rss.xml')('/blog/rss.xml')).toBe(true);
  });

  it('does not hold otherwise', () => {
    expect(hasSuffix('.md')('/about.md/')).toBe(false);
    expect(hasSuffix('/rss.xml')('/rss.xml.bak')).toBe(false);
  });
});

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
