import { draftCookieHeader } from '@lib/draft-mode';
import { isAllowedPreviewPath } from '@lib/preview/allowed-paths';
import { getRequestContext } from '@lib/request-context';
import { matchesSecret } from '@utils/safe-equal';

import type { APIRoute } from 'astro';

// Port of apps/web/src/app/next/preview/route.ts — the Payload Live Preview handshake.
// The cms admin iframe points here with `path` + `previewSecret`; this route verifies
// the secret, sets the draft cookie (src/lib/draft-mode, in place of Next draft mode),
// then 307-redirects to the preview page so it renders the latest draft. The admin
// session lives on the cms origin, so the shared secret is the gate (drafts themselves
// are fetched from the cms with the same secret). The worker stamps `no-store` on
// `/next/*` and allows the cms origin as frame ancestor.
export const GET: APIRoute = async ({ url }) => {
  const path = url.searchParams.get('path');
  const previewSecret = url.searchParams.get('previewSecret') ?? undefined;
  const { env } = getRequestContext();

  if (!matchesSecret(previewSecret, env.PREVIEW_SECRET)) {
    return new Response('You are not allowed to preview this page', { status: 403 });
  }

  // Only the previewable collections' draft routes may be served (see
  // PREVIEW_PATH_PREFIXES). Anything else — including open-redirect attempts — is
  // rejected before the cookie is set.
  if (!isAllowedPreviewPath(path)) {
    return new Response('This endpoint can only be used for preview routes', { status: 400 });
  }

  return new Response(null, { status: 307, headers: { Location: path, 'Set-Cookie': await draftCookieHeader(env.PREVIEW_SECRET) } });
};
