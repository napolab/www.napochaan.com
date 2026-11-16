import { buildPoppyDiscovery } from '@utils/agent-discovery/build-poppy-discovery';
import { discoveryJSONResponse } from '@utils/agent-discovery/discovery-json-response';

import type { APIRoute } from 'astro';

// Personal Agent Protocol (draft 0.1) website-only discovery.
export const GET: APIRoute = () => discoveryJSONResponse(buildPoppyDiscovery({ baseUrl: process.env.BASE_URL ?? 'http://localhost:3000' }));
