import { clearDraftCookieHeader } from '@lib/draft-mode';
import { resolveExitRedirect } from '@lib/preview/redirect-target';
import { getRequestContext } from '@lib/request-context';

import type { APIRoute } from 'astro';

// Port of apps/web/src/app/next/exit-preview/route.ts. Clears the draft cookie, then
// 307-redirects. Pair to the preview handshake at `/next/preview`.
// - Without `redirect`, lands on the public home page.
// - The cms logout chains through here (`?redirect=<cms>/cdn-cgi/access/logout`) so
//   logging out of the cms also ends draft mode on web. `redirect` is allowlisted to
//   this origin and the exact `CMS_ORIGIN`; anything else → `/`.
export const GET: APIRoute = ({ request, url }) => {
  const { env } = getRequestContext();
  const target = resolveExitRedirect(url.searchParams.get('redirect'), { requestURL: request.url, cmsOrigin: env.CMS_ORIGIN ?? '' });

  return new Response(null, { status: 307, headers: { Location: target, 'Set-Cookie': clearDraftCookieHeader() } });
};
