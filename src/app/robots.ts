import { isProductionHost } from '@utils/is-production-host';
import { buildRobots } from '@utils/robots/build-robots';

import type { MetadataRoute } from 'next';

// Force runtime resolution so BASE_URL is read per-request rather than baked in
// at build time — non-production hosts must block crawlers.
export const dynamic = 'force-dynamic';

const robots = (): MetadataRoute.Robots => {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';

  return buildRobots({ baseUrl, isProduction: isProductionHost(baseUrl) });
};

export default robots;
