import { isProductionHost } from '@utils/is-production-host';
import { buildRobots } from '@utils/robots/build-robots';
import { serializeRobots } from '@utils/robots/serialize-robots';

import type { APIRoute } from 'astro';

// Port of apps/web/src/app/robots.ts (a Next metadata route). BASE_URL is read per
// request: non-production hosts must block crawlers.
export const GET: APIRoute = () => {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';

  return new Response(serializeRobots(buildRobots({ baseUrl, isProduction: isProductionHost(baseUrl) })), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
