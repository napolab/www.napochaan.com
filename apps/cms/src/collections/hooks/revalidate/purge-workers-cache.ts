import { getCloudflareContext } from '@opennextjs/cloudflare';

// Every CMS write invalidates the whole Workers Cache. Writes are rare on this
// site and a full purge is one API call, which beats maintaining a path→tag map
// (decision recorded in docs/superpowers/specs/2026-09-22-performance-tuning-design.md).
// Runs only inside the deployed Worker; the Payload CLI (seed/migrate) has no
// Cloudflare context and skips silently, matching the revalidateTag pattern.
// `ctx.cache` is optional in the runtime types: it is absent when the Worker has
// no `[cache]` block (e.g. the default/local env), which is also a silent skip.
export const purgeWorkersCache = (): void => {
  try {
    const { ctx } = getCloudflareContext();
    const cache = ctx.cache;
    if (cache === undefined) return;
    const purge = async (): Promise<void> => {
      try {
        await cache.purge({ purgeEverything: true });
      } catch {
        // best-effort: a failed purge only delays freshness until the next write
      }
    };
    ctx.waitUntil(purge());
  } catch {
    // Outside a worker request context. Nothing to purge.
  }
};
