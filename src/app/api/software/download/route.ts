import { getCloudflareContext } from '@opennextjs/cloudflare';

import { getPayloadClient } from '@lib/payload/client';

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

  const payload = await getPayloadClient();
  const release = await payload.findByID({ collection: 'software-release', id: resolved.releaseId, overrideAccess: true }).catch(() => undefined);
  const filename = typeof release?.filename === 'string' ? release.filename : undefined;
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
