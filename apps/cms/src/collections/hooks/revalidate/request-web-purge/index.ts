import { getCloudflareContext } from '@opennextjs/cloudflare';

// `wrangler types` emits a Service Binding as a plain `Fetcher`; the RPC method lives on
// the web Worker's DEFAULT entrypoint (a named entrypoint reports success but does not
// evict — Task 0 spike), so it is declared here and narrowed with a guard.
type WebPurger = { purge(): Promise<void> };

const isWebPurger = (binding: unknown): binding is WebPurger => typeof binding === 'object' && binding !== null && 'purge' in binding && typeof binding.purge === 'function';

const purgeWeb = async (web: WebPurger): Promise<void> => {
  try {
    await web.purge();
  } catch {
    // best-effort: a failed purge only delays freshness until the next publish
  }
};

/**
 * Ask the public web Worker to drop its cached pages, over the `WEB` Service Binding.
 * Best-effort and fire-and-forget (`ctx.waitUntil`): a missing Cloudflare context (Payload
 * CLI seed/migrate), a missing binding (local dev without web), or a failing web Worker
 * must never fail the CMS write.
 */
export const requestWebPurge = (): void => {
  try {
    const { env, ctx } = getCloudflareContext();
    const web: unknown = env.WEB;
    if (!isWebPurger(web)) return;
    ctx.waitUntil(purgeWeb(web));
  } catch {
    // Outside a worker request context. Nothing to purge.
  }
};
