import { findBlogList } from '@lib/cms/blog';
import { markdownResponse } from '@utils/markdown/response';

import { buildBlogIndexMarkdown } from '../features/blog/lib/build-blog-index-markdown';

import type { APIRoute } from 'astro';

// Port of apps/web/src/app/(site)/blog.md/route.ts.
export const GET: APIRoute = async () => {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';

  return markdownResponse(buildBlogIndexMarkdown(await findBlogList(), baseUrl));
};
