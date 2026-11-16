import { AI_CATALOG_MEDIA_TYPE, buildAICatalog } from '@utils/ai-catalog/build-ai-catalog';

import type { APIRoute } from 'astro';

// AI Catalog for domain-level agent discovery (advertises the MCP server card). The body
// depends only on BASE_URL (a deploy-constant `[vars]` value), so the worker's catch-all
// `cms` policy applies. Public, read-only metadata: open CORS for browser-based clients.
export const GET: APIRoute = () => {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';

  return new Response(JSON.stringify(buildAICatalog({ baseUrl })), {
    headers: { 'content-type': AI_CATALOG_MEDIA_TYPE, 'access-control-allow-origin': '*' },
  });
};
