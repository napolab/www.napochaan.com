import { when } from '../../../../lib/first-match-runner';
import { isWithinPath } from '../../../../lib/path-predicate';
import { anyOf } from '../../../../lib/predicate';
import { PAGE_CACHE_POLICIES } from '../../../../../src/utils/cache-control';
import { PREVIEW_ROOTS } from '../../../path-policy/plugins/preview-frame';
import { denyWith } from '../../directives';
import { orDecoded } from '../../predicates';

import type { CacheControlPlugin } from '../../types';

// Draft previews render unpublished data under the draft-mode cookie and `/next/*` sets or
// clears that cookie. Astro Actions (`/_actions/*`, form / RPC submissions) and server
// islands (`/_server-islands/*`, per-request deferred renders) are per-request by design.
// None may ever be stored, whatever their status or cookies.
const UNCACHEABLE_ROOTS = [...PREVIEW_ROOTS, '/next', '/_actions', '/_server-islands'] as const;

const isUncacheablePath = orDecoded(anyOf(...UNCACHEABLE_ROOTS.map(isWithinPath)));

export const uncacheablePlugin: CacheControlPlugin = when(isUncacheablePath, () => denyWith(PAGE_CACHE_POLICIES.uncacheable));
