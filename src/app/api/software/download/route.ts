import { getCloudflareContext } from '@opennextjs/cloudflare';

import { findDownloadableReleaseFile } from '@lib/payload/software/find-downloadable-release';

import { resolveDownloadRequest } from './resolve-download';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const forbidden = (): Response => new Response('Forbidden', { status: 403 });

// R2 object key for a release file. Matches the storage-r2 `prefix: 'releases'` option
// (see payload.config.ts). If the prefix path was dropped in Task 2 Step 3, change this
// to `filename`.
const objectKey = (filename: string): string => `releases/${filename}`;

export const GET = async (request: NextRequest): Promise<Response> => {
  const { env } = await getCloudflareContext({ async: true });
  const resolved = await resolveDownloadRequest(request.nextUrl.searchParams, env.PAYLOAD_SECRET, Date.now());
  if (!resolved.ok) return forbidden();

  const filename = await findDownloadableReleaseFile(resolved.releaseId);
  if (filename === undefined) return forbidden();

  if (env.R2 === undefined) return forbidden();
  const object = await env.R2.get(objectKey(filename));
  if (object === null) return forbidden();

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
};
