/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import '@payloadcms/next/css';
import { REST_DELETE, REST_GET, REST_OPTIONS, REST_PATCH, REST_POST, REST_PUT } from '@payloadcms/next/routes';

import config from '@payload-config';

export const GET = REST_GET(config);
// Upstream bug: payloadcms/payload#16754 (HEAD → 404 on /api/media/file/*).
// Remove this handler once Payload ships a fix that rewrites the method —
// the pending payloadcms/payload#16761 (`HEAD = GET`) alone is NOT enough.
export const HEAD = async (request: Request, context: Parameters<typeof GET>[1]) => {
  // Payload's endpoint dispatcher matches on exact method, so the original
  // HEAD request never reaches the 'get' media endpoint unless rewritten.
  const res = await GET(new Request(request, { method: 'GET' }), context);
  // res.body is an unread R2 ReadableStream; it must be released before
  // being discarded, or the underlying handle leaks.
  await res.body?.cancel();
  return new Response(null, { status: res.status, headers: res.headers });
};
export const POST = REST_POST(config);
export const DELETE = REST_DELETE(config);
export const PATCH = REST_PATCH(config);
export const PUT = REST_PUT(config);
export const OPTIONS = REST_OPTIONS(config);
