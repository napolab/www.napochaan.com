import { rssResponse } from '@utils/rss/response';

import { buildLogRSS } from '../../features/log/lib/build-log-rss';
import { loadLogTimeline } from '../../features/log/load-log';

import type { APIRoute } from 'astro';

// Port of apps/web/src/app/(site)/log/rss.xml/route.ts. BASE_URL is read per request
// (wrangler vars). Cached under the worker's `timeSensitive` policy.
export const GET: APIRoute = async () => {
  const origin = process.env.BASE_URL ?? 'http://localhost:3000';

  return rssResponse(buildLogRSS(await loadLogTimeline(), origin));
};
