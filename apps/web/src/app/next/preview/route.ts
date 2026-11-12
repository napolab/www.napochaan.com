import { getCloudflareContext } from '@opennextjs/cloudflare';
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

import { isAllowedPreviewPath } from './allowed-paths';

// An unset/empty configured secret must never authorize: otherwise
// `?previewSecret=` would match it.
const isValidSecret = (submitted: string | undefined, expected: string | undefined): boolean => expected !== undefined && expected !== '' && submitted === expected;

// Payload Live Preview handshake (official draft-mode pattern). The cms admin
// iframe points here with `path` + `previewSecret`; this route verifies the
// secret, enables Next draft mode, then redirects to the preview page so
// server-side rendering returns the latest draft. The admin session lives on the
// cms origin, so the shared secret is the gate (drafts themselves are fetched
// from the cms with the same secret).
export const GET = async (req: Request): Promise<Response> => {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path');
  const previewSecret = searchParams.get('previewSecret') ?? undefined;

  const { env } = await getCloudflareContext({ async: true });

  if (!isValidSecret(previewSecret, env.PREVIEW_SECRET)) {
    return new Response('You are not allowed to preview this page', { status: 403 });
  }

  // Only the previewable collections' draft routes may be served (see
  // PREVIEW_PATH_PREFIXES). Anything else — including open-redirect attempts —
  // is rejected before draft mode is touched.
  if (!isAllowedPreviewPath(path)) {
    return new Response('This endpoint can only be used for preview routes', { status: 400 });
  }

  const draft = await draftMode();
  draft.enable();
  redirect(path);
};
