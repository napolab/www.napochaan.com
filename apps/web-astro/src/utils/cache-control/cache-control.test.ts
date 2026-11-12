import { describe, expect, it } from 'vitest';

import { PAGE_CACHE_POLICIES } from './index';

describe('PAGE_CACHE_POLICIES', () => {
  it('pins the per-class Cache-Control values', () => {
    expect(PAGE_CACHE_POLICIES).toEqual({
      cms: 'public, max-age=0, s-maxage=31536000',
      timeSensitive: 'public, max-age=0, s-maxage=3600',
      uncacheable: 'no-store',
    });
  });

  // A purge only empties the edge: browsers must revalidate HTML on every view.
  it.each([PAGE_CACHE_POLICIES.cms, PAGE_CACHE_POLICIES.timeSensitive])('%s keeps HTML out of the browser cache', (policy) => {
    expect(policy).toMatch(/(^|, )max-age=0(,|$)/);
  });

  it.each(Object.entries(PAGE_CACHE_POLICIES))('%s never uses must-revalidate', (_, policy) => {
    expect(policy).not.toMatch(/must-revalidate/);
  });
});
