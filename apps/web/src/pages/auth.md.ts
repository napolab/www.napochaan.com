import { buildAuthMarkdown } from '@utils/agent-discovery/build-auth-markdown';
import { markdownResponse } from '@utils/markdown/response';

import type { APIRoute } from 'astro';

// Auth.md agent-registration discovery, at the site root. Deploy-constant body (BASE_URL
// only), so the worker's catch-all `cms` policy applies. The path has an extension, so the
// worker never negotiates it.
export const GET: APIRoute = () => markdownResponse(buildAuthMarkdown({ baseUrl: process.env.BASE_URL ?? 'http://localhost:3000' }));
