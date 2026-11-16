import { discoveryJSONResponse } from '@utils/agent-discovery/discovery-json-response';
import { AI_CATALOG_MEDIA_TYPE, buildAICatalog } from '@utils/ai-catalog/build-ai-catalog';

import type { APIRoute } from 'astro';

// Agentic Resource Discovery manifest at the location ARD consumers MUST fetch (§5.1).
// Same builder as `/.well-known/ai-catalog.json`, so the two bodies never differ.
export const GET: APIRoute = () => discoveryJSONResponse(buildAICatalog({ baseUrl: process.env.BASE_URL ?? 'http://localhost:3000' }), AI_CATALOG_MEDIA_TYPE);
