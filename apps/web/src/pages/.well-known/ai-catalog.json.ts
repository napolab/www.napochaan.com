import { discoveryJSONResponse } from '@utils/agent-discovery/discovery-json-response';
import { AI_CATALOG_MEDIA_TYPE, buildAICatalog } from '@utils/ai-catalog/build-ai-catalog';

import type { APIRoute } from 'astro';

// Predecessor location of the ARD manifest (`/.well-known/ard.json` serves the same body).
// The body depends only on BASE_URL (a deploy-constant `[vars]` value), so the worker's
// catch-all `cms` policy applies. Public, read-only metadata: open CORS for browser-based clients.
export const GET: APIRoute = () => discoveryJSONResponse(buildAICatalog({ baseUrl: process.env.BASE_URL ?? 'http://localhost:3000' }), AI_CATALOG_MEDIA_TYPE);
