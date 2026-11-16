import { markdownResponse } from '@utils/markdown/response';

import { privacy } from '../features/privacy/content';
import { buildPrivacyMarkdown } from '../features/privacy/lib/build-privacy-markdown';

import type { APIRoute } from 'astro';

// The Markdown twin of /privacy (the worker negotiates `Accept: text/markdown` onto it).
export const GET: APIRoute = () => {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';

  return markdownResponse(buildPrivacyMarkdown(privacy, baseUrl));
};
