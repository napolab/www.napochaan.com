import { when } from '../../../../lib/first-match-runner';
import { isIn } from '../../../../lib/predicate';
import { PAGE_CACHE_POLICIES } from '../../../../../src/utils/cache-control';
import { pageWith } from '../../directives';
import { orDecoded } from '../../predicates';

import type { CacheControlPlugin } from '../../types';

// These render external RSS posts (log/_lib/fetch-external-posts), flip `upcoming`
// against the current time, or (security.txt) derive `Expires` from `dayjs()` now —
// none of it is reachable by a CMS purge, so they need a short max-age. Add a route
// here when it starts reading external data or the current time.
export const TIME_SENSITIVE_PATHS = ['/', '/log', '/log.md', '/log/rss.xml', '/.well-known/security.txt'] as const;

export const timeSensitivePlugin: CacheControlPlugin = when(orDecoded(isIn<string>(TIME_SENSITIVE_PATHS)), () => pageWith(PAGE_CACHE_POLICIES.timeSensitive));
