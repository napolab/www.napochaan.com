import { buildMCPServerCard } from '@utils/agent-discovery/build-mcp-server-card';
import { discoveryJSONResponse } from '@utils/agent-discovery/discovery-json-response';

import type { APIRoute } from 'astro';

// MCP Server Card for domain-level MCP discovery. Deploy-constant body (BASE_URL only).
export const GET: APIRoute = () => discoveryJSONResponse(buildMCPServerCard({ baseUrl: process.env.BASE_URL ?? 'http://localhost:3000' }));
