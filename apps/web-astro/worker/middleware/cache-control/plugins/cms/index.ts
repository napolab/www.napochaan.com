import { when } from '../../../../lib/first-match-runner';
import { PAGE_CACHE_POLICIES } from '../../../../../src/utils/cache-control';
import { pageWith } from '../../directives';

import type { CacheControlPlugin } from '../../types';

// Catch-all (registered last): every page, feed, `.md`, llms, sitemap, robots and OG image
// the earlier plugins did not claim is CMS-derived or deploy-constant, so it is kept until
// the next publish purge or deploy (Workers Cache keys entries by Worker version).
export const cmsPlugin: CacheControlPlugin = when(
  () => true,
  () => pageWith(PAGE_CACHE_POLICIES.cms),
);
