import { findBlogList } from '@lib/cms/blog';
import { rssResponse } from '@utils/rss/response';

import { buildBlogRSS } from '../../features/blog/lib/build-blog-rss';

import type { APIRoute } from 'astro';

// Port of apps/web/src/app/(site)/blog/rss.xml/route.ts. BASE_URL is read per request
// (wrangler vars), never baked in at build.
export const GET: APIRoute = async () => {
  const origin = process.env.BASE_URL ?? 'http://localhost:3000';

  return rssResponse(buildBlogRSS(await findBlogList(), origin));
};
