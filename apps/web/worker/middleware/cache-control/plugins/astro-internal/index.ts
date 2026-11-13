import { when } from '../../../../lib/first-match-runner';
import { hasPrefix, isExactPath } from '../../../../lib/path-predicate';
import { anyOf } from '../../../../lib/predicate';
import { KEEP } from '../../directives';

import type { CacheControlPlugin } from '../../types';

// `/_astro/*` is content-hashed and immutable (Workers Static Assets serve it with the
// public/_headers rule before the Worker runs; this only guards a fallthrough).
// `/_next/image` sets its own policy (worker/app.ts `cache()`), and Astro's `/_image`
// endpoint does too. The cms catch-all must not overwrite any of them.
const isAstroInternalPath = anyOf(hasPrefix('/_astro/'), isExactPath('/_next/image'), isExactPath('/_image'));

export const astroInternalPlugin: CacheControlPlugin = when(isAstroInternalPath, () => KEEP);
