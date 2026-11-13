import { describe, expect, it } from 'vitest';

import config from '../../astro.config';

describe('astro.config', () => {
  // ClientRouter turns on `prefetchAll` (hover) unless `prefetch` is exactly `false`
  // (astro/components/ClientRouter.astro, __PREFETCH_DISABLED__). The Next site's react-aria links prefetched
  // nothing; the colophon demos' realistic hrefs must not be fetched either.
  it('disables prefetch so ClientRouter does not prefetch every link', () => {
    expect(config.prefetch).toBe(false);
  });
});
