import { when } from '../../../../lib/first-match-runner';
import { isIn } from '../../../../lib/predicate';
import { PAGE_CACHE_POLICIES } from '../../../../../src/utils/cache-control';
import { pageWith } from '../../directives';
import { orDecoded } from '../../predicates';

import type { CacheControlPlugin } from '../../types';

// These render external RSS posts (log/_lib/fetch-external-posts), flip `upcoming`
// against the current time, (security.txt) derive `Expires` from `dayjs()` now, or
// (oauth-authorization-server) proxy Cloudflare Access's live metadata — none of it is
// reachable by a CMS purge, so they need a short max-age. An hour bounds how long a key
// or endpoint change at Access can be masked by a stale copy; an upstream failure is a
// 502, which the Astro handler forces to `no-store`. Add a route here when it starts
// reading external data or the current time.
export const TIME_SENSITIVE_PATHS = ['/', '/log', '/log.md', '/log/rss.xml', '/.well-known/security.txt', '/.well-known/oauth-authorization-server'] as const;

export const timeSensitivePlugin: CacheControlPlugin = when(orDecoded(isIn<string>(TIME_SENSITIVE_PATHS)), () => pageWith(PAGE_CACHE_POLICIES.timeSensitive));
