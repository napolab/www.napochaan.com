import { findGalleryList } from '@lib/cms/gallery';
import { rssResponse } from '@utils/rss/response';

import { buildGalleryRSS } from '../../features/gallery/lib/build-gallery-rss';

import type { APIRoute } from 'astro';

// Port of apps/web/src/app/(site)/gallery/rss.xml/route.ts. BASE_URL is read per
// request (wrangler vars), never baked in at build.
export const GET: APIRoute = async () => {
  const origin = process.env.BASE_URL ?? 'http://localhost:3000';

  return rssResponse(buildGalleryRSS(await findGalleryList(), origin));
};
