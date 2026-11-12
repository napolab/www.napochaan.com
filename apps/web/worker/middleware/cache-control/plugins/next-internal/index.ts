import { when } from '../../../../lib/first-match-runner';
import { hasPrefix } from '../../../../lib/path-predicate';
import { KEEP } from '../../directives';

import type { CacheControlPlugin } from '../../types';

// `/_next/image` sets its own policy (worker/app.ts `cache()`), and `/_next/static` is
// content-hashed and immutable. The cms catch-all must not overwrite either.
export const nextInternalPlugin: CacheControlPlugin = when(hasPrefix('/_next/'), () => KEEP);
