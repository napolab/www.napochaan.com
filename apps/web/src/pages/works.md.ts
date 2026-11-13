import { findWorksList } from '@lib/cms/works';
import { markdownResponse } from '@utils/markdown/response';

import { buildWorksIndexMarkdown } from '../features/works/lib/build-works-index-markdown';

import type { APIRoute } from 'astro';

// Port of apps/web/src/app/(site)/works.md/route.ts.
export const GET: APIRoute = async () => {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';

  return markdownResponse(buildWorksIndexMarkdown(await findWorksList(), baseUrl));
};
