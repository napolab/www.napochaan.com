import { describe, expect, it } from 'vitest';

import { PAGE_CACHE_POLICIES } from '../../../../../src/utils/cache-control';
import { apiPlugin } from './index';

const DENY = { kind: 'deny', policy: PAGE_CACHE_POLICIES.uncacheable };

describe('apiPlugin', () => {
  it.each(['/api', '/api/health', '/api/anything/else', '/%61pi/health'])('forces no-store on %s', (pathname) => {
    expect(apiPlugin.run(pathname)._unsafeUnwrap()).toEqual(DENY);
  });

  it.each(['/', '/apix', '/blog/api', '/blog/a'])('does not match %s', (pathname) => {
    expect(apiPlugin.run(pathname).isErr()).toBe(true);
  });
});
