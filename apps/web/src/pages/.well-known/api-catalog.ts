import { API_CATALOG_CONTENT_TYPE, buildAPICatalog } from '@utils/agent-discovery/build-api-catalog';
import { discoveryJSONResponse } from '@utils/agent-discovery/discovery-json-response';

import type { APIRoute } from 'astro';

// RFC 9727 API Catalog. Astro answers HEAD with this GET handler (body dropped).
export const GET: APIRoute = () => discoveryJSONResponse(buildAPICatalog({ baseUrl: process.env.BASE_URL ?? 'http://localhost:3000' }), API_CATALOG_CONTENT_TYPE);
