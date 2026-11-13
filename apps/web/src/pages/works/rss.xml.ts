import { findWorksList } from '@lib/cms/works';
import { rssResponse } from '@utils/rss/response';

import { buildWorksRSS } from '../../features/works/lib/build-works-rss';

import type { APIRoute } from 'astro';

// Port of apps/web/src/app/(site)/works/rss.xml/route.ts. BASE_URL is read per request
// (wrangler vars), never baked in at build.
export const GET: APIRoute = async () => {
  const origin = process.env.BASE_URL ?? 'http://localhost:3000';

  return rssResponse(buildWorksRSS(await findWorksList(), origin));
};
