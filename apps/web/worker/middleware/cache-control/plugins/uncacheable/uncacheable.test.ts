import { describe, expect, it } from 'vitest';

import { PAGE_CACHE_POLICIES } from '../../../../../src/utils/cache-control';
import { uncacheablePlugin } from './index';

const DENY = { kind: 'deny', policy: PAGE_CACHE_POLICIES.uncacheable };

describe('uncacheablePlugin', () => {
  it.each([
    '/blog/preview',
    '/blog/preview/1',
    '/news/preview/1',
    '/works/preview/1',
    '/gallery/preview',
    '/log/preview',
    '/next/preview',
    '/next/exit-preview',
    '/admin',
    '/admin/collections/blog',
    '/blog/%70review/1',
    '/%61dmin',
  ])('forces no-store on %s', (pathname) => {
    expect(uncacheablePlugin.run(pathname)._unsafeUnwrap()).toEqual(DENY);
  });

  it.each(['/', '/blog', '/blog/a', '/blog/previewx', '/administrator', '/nextx', '/log'])('does not match %s', (pathname) => {
    expect(uncacheablePlugin.run(pathname).isErr()).toBe(true);
  });
});
