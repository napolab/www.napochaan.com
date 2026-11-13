import { getCMSClient } from '@lib/cms/client';

import type { APIRoute } from 'astro';

const PREFIX = '/api/media/file/';

// Next handed the route the segment fully decoded (decodeURIComponent). Astro's
// `params` use decodeURI, which leaves reserved escapes such as `%23` / `%3F` encoded,
// so decode the raw pathname segment instead. A malformed escape cannot name a file.
const decodeFilename = (pathname: string): string | undefined => {
  try {
    return decodeURIComponent(pathname.slice(PREFIX.length));
  } catch {
    return undefined;
  }
};

// Port of apps/web/src/app/api/media/file/[filename]/route.ts. Media originals live in
// the cms Worker's R2 bucket; this relays the cms `/media/:filename` response (status,
// headers, streamed body) as-is at the historical URL — a cms 404 stays a 404. The
// worker's media plugin fills MEDIA_POLICY on a 200 only when the cms sent no
// Cache-Control; a 404 gets the handler's `no-store` (Next sent `private, no-cache,
// no-store…`). hono's client inserts params raw, so encode the decoded name once here.
export const GET: APIRoute = async ({ url }) => {
  const filename = decodeFilename(url.pathname);
  if (filename === undefined) return new Response('Bad Request', { status: 400 });

  const res = await getCMSClient().media[':filename'].$get({ param: { filename: encodeURIComponent(filename) } });

  return new Response(res.body, { status: res.status, headers: res.headers });
};
