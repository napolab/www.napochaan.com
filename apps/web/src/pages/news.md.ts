import { findNewsList } from '@lib/cms/news';
import { markdownResponse } from '@utils/markdown/response';

import { buildNewsIndexMarkdown } from '../features/news/lib/build-news-index-markdown';

import type { APIRoute } from 'astro';

// Port of apps/web/src/app/(site)/news.md/route.ts.
export const GET: APIRoute = async () => {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';

  return markdownResponse(buildNewsIndexMarkdown(await findNewsList(), baseUrl));
};
