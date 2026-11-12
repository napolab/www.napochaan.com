import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';
import { withRegionalCache } from '@opennextjs/cloudflare/overrides/incremental-cache/regional-cache';
import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue';
import d1NextTagCache from '@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache';

export default defineCloudflareConfig({
  // Regional cache puts the per-datacenter Cache API in front of R2, so intercepted
  // requests skip the R2 round-trip on hits. Correctness is preserved without a
  // cachePurge override: the D1 tag cache is still consulted on every hit, so a CMS
  // revalidateTag/revalidatePath takes effect immediately, and long-lived entries
  // lazily re-sync from R2 in the background (capped at 30 min by default). Cache
  // keys are build-ID-prefixed, so deploys never serve a previous build's HTML.
  incrementalCache: withRegionalCache(r2IncrementalCache, { mode: 'long-lived' }),
  queue: doQueue,
  tagCache: d1NextTagCache,
  enableCacheInterception: true,
});
