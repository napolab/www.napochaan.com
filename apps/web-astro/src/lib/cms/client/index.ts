import { hc } from 'hono/client';

import { getRequestContext } from '../../request-context';

import type { CMSAppType } from '@napochaan/cms-api/app';

// The Service Binding ignores the URL host; this placeholder only satisfies `hc`.
const CMS_ORIGIN = 'https://cms.internal';

export type CMSClient = ReturnType<typeof hc<CMSAppType>>;

// Typed Hono RPC client over the cms Worker's named `CMS` entrypoint
// (wrangler.toml `[[services]] binding = "CMS"`). Built per call — `hc` is a
// cheap proxy, and the binding lives on the per-request context, already wrapped
// by cms-health (worker/handlers/astro) so a failed read is never cached.
export const getCMSClient = (): CMSClient => {
  const cms = getRequestContext().env.CMS;
  if (cms === undefined) throw new Error('CMS service binding is not configured (wrangler.toml [[services]] binding = "CMS")');

  return hc<CMSAppType>(CMS_ORIGIN, { fetch: cms.fetch.bind(cms) });
};
