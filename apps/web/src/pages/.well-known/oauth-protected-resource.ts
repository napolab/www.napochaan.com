import { buildOAuthProtectedResource } from '@utils/agent-discovery/build-oauth-protected-resource';
import { discoveryJSONResponse } from '@utils/agent-discovery/discovery-json-response';

import type { APIRoute } from 'astro';

// RFC 9728 metadata for the MCP authoring server (mirror of the MCP Portal's own document).
export const GET: APIRoute = () => discoveryJSONResponse(buildOAuthProtectedResource({ baseUrl: process.env.BASE_URL ?? 'http://localhost:3000' }));
