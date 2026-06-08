import { getCloudflareContext } from '@opennextjs/cloudflare';
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

import { getPayloadClient } from '@lib/payload/client';

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

  // Allowlist the only path this handshake serves. A bare `startsWith('/')`
  // would let protocol-relative URLs like `//evil.com` through and turn this into
  // an open redirect, so we pin the prefix to the news preview route.
  if (path === null || path.startsWith('/news/preview/') === false) {
    return new Response('This endpoint can only be used for news preview', { status: 400 });
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
