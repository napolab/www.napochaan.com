import { getCloudflareContext } from '@opennextjs/cloudflare';
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

import { resolveExitRedirect } from './redirect-target';

// Disables Next draft mode (the `__prerender_bypass` cookie lives on this web
// origin), then redirects. Pair to the preview handshake at `/next/preview`.
// - Without `redirect`, lands on the public home page.
// - The cms logout chains through here (`?redirect=<cms>/cdn-cgi/access/logout`)
//   so logging out of the cms also ends draft mode on web. `redirect` is
//   allowlisted to this origin and the exact `CMS_ORIGIN`; anything else → `/`.
export const GET = async (req: Request): Promise<Response> => {
  const { env } = await getCloudflareContext({ async: true });
  const target = resolveExitRedirect(new URL(req.url).searchParams.get('redirect'), { requestURL: req.url, cmsOrigin: env.CMS_ORIGIN ?? '' });

  const draft = await draftMode();
  draft.disable();
  redirect(target);
};
