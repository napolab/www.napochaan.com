import { when } from '../../../../lib/first-match-runner';
import { isWithinPath } from '../../../../lib/path-predicate';
import { PAGE_CACHE_POLICIES } from '../../../../../src/utils/cache-control';
import { denyWith } from '../../directives';
import { orDecoded } from '../../predicates';

import type { CacheControlPlugin } from '../../types';

// Future-proofing: web has no API of its own besides the media file route. Register AFTER the
// media plugin so `/api/media/file/*` keeps its public policy; any other 200 under `/api`
// must never be stamped public by the catch-all cms plugin.
export const apiPlugin: CacheControlPlugin = when(orDecoded(isWithinPath('/api')), () => denyWith(PAGE_CACHE_POLICIES.uncacheable));
