import { getCMSClient } from '@lib/cms/client';

type Context = { params: Promise<{ filename: string }> };

// Media originals live in the cms Worker's R2 bucket. Serve them at the
// historical `/api/media/file/<filename>` URL by relaying the cms
// `/media/:filename` response (status, headers, streamed body) as-is — a cms
// 404 stays a 404. Caching is applied by the worker's MEDIA_POLICY
// (worker/middleware/cache-control/plugins/media).
// Next hands us the decoded param; hono's client inserts params raw, so encode
// it once here.
export const GET = async (_req: Request, { params }: Context): Promise<Response> => {
  const { filename } = await params;
  const cms = await getCMSClient();
  const res = await cms.media[':filename'].$get({ param: { filename: encodeURIComponent(filename) } });

  // Rebuild rather than return the binding's Response object: under `next dev`
  // binding responses come through a proxy, so hand Next a plain Response.
  return new Response(res.body, { status: res.status, headers: res.headers });
};
