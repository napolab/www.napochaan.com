import { getCloudflareContext } from '@opennextjs/cloudflare';

type PurgeOptions = { purgeEverything: true };
type PurgeResult = { success: boolean; errors?: ReadonlyArray<{ code: number; message: string }> };
type WorkersCache = { purge: (options: PurgeOptions) => Promise<PurgeResult> };

// `ctx.cache` is newer than the wrangler-generated ExecutionContext type this repo
// pins, so narrow structurally instead of casting.
const readCache = (ctx: unknown): WorkersCache | undefined => {
  if (typeof ctx !== 'object' || ctx === null || !('cache' in ctx)) return undefined;
  const candidate = (ctx as { cache?: { purge?: unknown } }).cache;
  if (typeof candidate?.purge !== 'function') return undefined;
  return candidate as WorkersCache;
};

// Every CMS write invalidates the whole Workers Cache. Writes are rare on this
// site and a full purge is one API call, which beats maintaining a path→tag map
// (decision recorded in docs/superpowers/specs/2026-09-22-performance-tuning-design.md).
// Runs only inside the deployed Worker; the Payload CLI (seed/migrate) has no
// Cloudflare context and skips silently, matching the revalidateTag pattern.
export const purgeWorkersCache = (): void => {
  try {
    const { ctx } = getCloudflareContext();
    const cache = readCache(ctx);
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
