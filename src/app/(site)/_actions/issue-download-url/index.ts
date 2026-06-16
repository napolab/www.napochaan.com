'use server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { headers } from 'next/headers';

import { verifyTurnstile } from '@lib/contact/verify-turnstile';
import { signDownloadToken } from '@lib/software/download-token';

import { buildDownloadURL } from './build-download-url';

export type IssueDownloadResult = { url: string } | { error: string };

// Short-lived signed URL TTL. Long enough to start a navigation, short enough that a
// leaked URL is useless within seconds.
const DOWNLOAD_URL_TTL_MS = 60_000;

const resolveRemoteIp = async (): Promise<string | undefined> => {
  const headerList = await headers();
  return headerList.get('CF-Connecting-IP') ?? undefined;
};

// Verify the Turnstile token, then mint a signed, expiring URL pointing at the GET
// route. Returns an error string (never throws to the client) when verification fails.
export const issueDownloadURL = async (releaseId: string, token: string): Promise<IssueDownloadResult> => {
  const { env } = await getCloudflareContext({ async: true });
  const verified = await verifyTurnstile(token, env, await resolveRemoteIp());
  if (!verified) return { error: '認証を確認できませんでした。もう一度お試しください。' };

  const exp = Date.now() + DOWNLOAD_URL_TTL_MS;
  const sig = await signDownloadToken({ releaseId, exp }, env.PAYLOAD_SECRET);
  return { url: buildDownloadURL({ releaseId, exp, sig }) };
};
