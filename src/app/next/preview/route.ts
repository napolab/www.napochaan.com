import { getCloudflareContext } from '@opennextjs/cloudflare';
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

import { getPayloadClient } from '@lib/payload/client';

import { isAllowedPreviewPath } from './allowed-paths';

// Payload Live Preview handshake (official draft-mode pattern). The CMS iframe
// points here with `path` + `previewSecret`; this route verifies the secret,
// authenticates the admin user, enables Next draft mode, then redirects to the
// preview page so server-side rendering returns the latest draft.
export const GET = async (req: Request): Promise<Response> => {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path');
  const previewSecret = searchParams.get('previewSecret');

  const { env } = await getCloudflareContext({ async: true });
  const expected = env.PREVIEW_SECRET;

  if (previewSecret !== expected) {
    return new Response('You are not allowed to preview this page', { status: 403 });
  }

  // Only the previewable collections' draft routes may be served (see
  // PREVIEW_PATH_PREFIXES). Anything else — including open-redirect attempts —
  // is rejected before draft mode is touched.
  if (!isAllowedPreviewPath(path)) {
    return new Response('This endpoint can only be used for preview routes', { status: 400 });
  }

  const draft = await draftMode();

  const payload = await getPayloadClient();
  const user = await authenticate(payload, req.headers);
  if (user === undefined) {
    draft.disable();

    return new Response('You are not allowed to preview this page', { status: 403 });
  }

  draft.enable();
  redirect(path);
};

// Resolve the authenticated admin via Payload, returning `undefined` when no
// user is attached or auth throws (invalid/expired token).
const authenticate = async (payload: Awaited<ReturnType<typeof getPayloadClient>>, headers: Headers): Promise<unknown> => {
  try {
    const { user } = await payload.auth({ headers });
    if (user === null) return undefined;

    return user;
  } catch {
    return undefined;
  }
};
