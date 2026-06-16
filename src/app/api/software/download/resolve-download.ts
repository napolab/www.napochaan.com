import { verifyDownloadToken } from '@lib/software/download-token';

export type ResolvedDownload = { ok: true; releaseId: string } | { ok: false };

// Validate the signed-URL params: all present, signature matches, not expired.
// `now` is injected for testability. Never throws — any malformed input -> { ok: false }.
export const resolveDownloadRequest = async (params: URLSearchParams, secret: string, now: number): Promise<ResolvedDownload> => {
  const releaseId = params.get('releaseId');
  const expRaw = params.get('exp');
  const sig = params.get('sig');
  if (releaseId === null || expRaw === null || sig === null) return { ok: false };

  const exp = parseInt(expRaw, 10);
  if (Number.isNaN(exp) || exp <= now) return { ok: false };

  const valid = await verifyDownloadToken({ releaseId, exp }, sig, secret);
  return valid ? { ok: true, releaseId } : { ok: false };
};
