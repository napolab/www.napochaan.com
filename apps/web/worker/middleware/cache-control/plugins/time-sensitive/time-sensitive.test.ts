import { describe, expect, it } from 'vitest';

import { PAGE_CACHE_POLICIES } from '../../../../../src/utils/cache-control';
import { timeSensitivePlugin } from './index';

describe('timeSensitivePlugin', () => {
  // External RSS posts + `dayjs()` now: a CMS purge cannot refresh these.
  it.each(['/', '/log', '/log.md', '/log/rss.xml', '/.well-known/security.txt', '/%6Cog'])('applies the time-sensitive policy to %s', (pathname) => {
    expect(timeSensitivePlugin.run(pathname)._unsafeUnwrap()).toEqual({ kind: 'page', policy: PAGE_CACHE_POLICIES.timeSensitive });
  });

  it.each(['/log/preview', '/blog', '/logs', '/log/', '/works.md'])('does not match %s', (pathname) => {
    expect(timeSensitivePlugin.run(pathname).isErr()).toBe(true);
  });
});
