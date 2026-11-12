import { describe, expect, it } from 'vitest';

import { PAGE_CACHE_POLICIES } from '../../../../../src/utils/cache-control';
import { cmsPlugin } from './index';

describe('cmsPlugin', () => {
  // Catch-all: everything the earlier plugins did not claim is purge-driven.
  it.each(['/blog/a', '/works', '/about', '/blog/rss.xml', '/llms.txt', '/sitemap.xml', '/anything'])('applies the cms policy to %s', (pathname) => {
    expect(cmsPlugin.run(pathname)._unsafeUnwrap()).toEqual({ kind: 'page', policy: PAGE_CACHE_POLICIES.cms });
  });
});
