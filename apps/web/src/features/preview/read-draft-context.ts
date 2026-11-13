import { isDraftEnabled } from '@lib/draft-mode';
import { getRequestContext } from '@lib/request-context';

export type DraftContext = {
  // PREVIEW_SECRET, sent to the cms as `x-preview-secret` to read drafts.
  previewSecret: string;
  // CMS_ORIGIN for the Live Preview listener (undefined → it mounts nothing).
  cmsOrigin: string | undefined;
};

// The draft-mode gate every preview page runs before reading anything (Next's
// `draftMode().isEnabled` + the `PREVIEW_SECRET === ''` guard). Undefined → the page
// 404s, so drafts never leak: no valid draft cookie, or no configured secret (which
// could never have passed the `/next/preview` handshake either).
export const readDraftContext = async (request: Request): Promise<DraftContext | undefined> => {
  const { env } = getRequestContext();
  const previewSecret = env.PREVIEW_SECRET ?? '';
  if (!(await isDraftEnabled(request.headers.get('cookie'), previewSecret))) return undefined;

  return { previewSecret, cmsOrigin: env.CMS_ORIGIN };
};
