// Per-request health of the `CMS` Service Binding. A page whose CMS read failed still
// renders a 200 (the read sits behind <Suspense> / an error fallback), and the cms
// policy would keep that broken page at the edge until the next purge. The worker
// wraps the binding for each request, and the cache-control middleware forces
// `no-store` when it was degraded.

export type CMSHealth = { readonly isDegraded: () => boolean; readonly markDegraded: () => void };

// Hono context variable set by the Next handler (worker/handlers/next).
export type CMSHealthVariables = { cmsDegraded?: boolean };

export const createCMSHealth = (): CMSHealth => {
  const state = { degraded: false };

  return {
    isDegraded: () => state.degraded,
    markDegraded: () => {
      state.degraded = true;
    },
  };
};

// 404 (missing slug) and 403 (preview secret mismatch) are normal outcomes.
export const isDegradedCMSResponse = (response: Response): boolean => response.status >= 500;

const trackedFetch =
  (target: Fetcher, health: CMSHealth): Fetcher['fetch'] =>
  async (...args) => {
    try {
      const response = await target.fetch(...args);
      if (isDegradedCMSResponse(response)) health.markDegraded();
      return response;
    } catch (error) {
      health.markDegraded();
      throw error;
    }
  };

// Only `fetch` is observed (the Hono RPC client, media relay and OG loader all go
// through it); every other member is forwarded to the real binding unchanged.
export const trackCMSBinding = <T extends Fetcher>(target: T, health: CMSHealth): T =>
  new Proxy(target, {
    get(binding, property) {
      if (property === 'fetch') return trackedFetch(binding, health);
      const value: unknown = Reflect.get(binding, property);
      return typeof value === 'function' ? value.bind(binding) : value;
    },
  });

// `app.request()` without env (tests) leaves env undefined.
export const withTrackedCMS = <E extends Cloudflare.Env | undefined>(env: E, health: CMSHealth): E => {
  const cms = env?.CMS;
  if (cms === undefined) return env;

  return { ...env, CMS: trackCMSBinding(cms, health) };
};
