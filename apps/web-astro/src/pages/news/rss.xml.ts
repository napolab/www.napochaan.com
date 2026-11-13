import { findNewsList } from '@lib/cms/news';
import { rssResponse } from '@utils/rss/response';

import { buildNewsRSS } from '../../features/news/lib/build-news-rss';

import type { APIRoute } from 'astro';

// Port of apps/web/src/app/(site)/news/rss.xml/route.ts. BASE_URL is read per request
// (wrangler vars), never baked in at build.
export const GET: APIRoute = async () => {
  const origin = process.env.BASE_URL ?? 'http://localhost:3000';

  return rssResponse(buildNewsRSS(await findNewsList(), origin));
};
