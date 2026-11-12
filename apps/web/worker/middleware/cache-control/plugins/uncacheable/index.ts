import { when } from '../../../../lib/first-match-runner';
import { isWithinPath } from '../../../../lib/path-predicate';
import { anyOf } from '../../../../lib/predicate';
import { PAGE_CACHE_POLICIES } from '../../../../../src/utils/cache-control';
import { PREVIEW_ROOTS } from '../../../path-policy/plugins/preview-frame';
import { denyWith } from '../../directives';
import { orDecoded } from '../../predicates';

import type { CacheControlPlugin } from '../../types';

// Draft previews render unpublished data under the draft-mode cookie and `/next/*` sets or
// clears that cookie. Neither may ever be stored, whatever their status or cookies.
const UNCACHEABLE_ROOTS = [...PREVIEW_ROOTS, '/next'] as const;

const isUncacheablePath = orDecoded(anyOf(...UNCACHEABLE_ROOTS.map(isWithinPath)));

export const uncacheablePlugin: CacheControlPlugin = when(isUncacheablePath, () => denyWith(PAGE_CACHE_POLICIES.uncacheable));
