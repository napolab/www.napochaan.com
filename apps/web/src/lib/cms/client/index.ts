import { getCloudflareContext } from '@opennextjs/cloudflare';
import { hc } from 'hono/client';

import type { CMSAppType } from '@napochaan/cms-api/app';

// The Service Binding ignores the URL host; this placeholder only satisfies `hc`.
const CMS_ORIGIN = 'https://cms.internal';

export type CMSClient = ReturnType<typeof hc<CMSAppType>>;

// Typed Hono RPC client over the cms Worker's named `CMS` entrypoint
// (wrangler.toml `[[services]] binding = "CMS"`). Built per call — `hc` is a
// cheap proxy, and the binding lives on the per-request Cloudflare context.
export const getCMSClient = (): CMSClient => {
  const { env } = getCloudflareContext();
  const cms = env.CMS;
  if (cms === undefined) throw new Error('CMS service binding is not configured (wrangler.toml [[services]] binding = "CMS")');

  return hc<CMSAppType>(CMS_ORIGIN, { fetch: cms.fetch.bind(cms) });
};
