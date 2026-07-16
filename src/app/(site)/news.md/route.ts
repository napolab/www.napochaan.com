import { findNewsList } from '@lib/payload/news';
import { markdownResponse } from '@utils/markdown/response';

import { buildNewsIndexMarkdown } from '../news/_lib/build-news-index-markdown';

export const dynamic = 'force-dynamic';

export const GET = async (): Promise<Response> => {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const items = await findNewsList();

  return markdownResponse(buildNewsIndexMarkdown(items, baseUrl));
};
