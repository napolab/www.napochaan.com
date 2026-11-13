import { findNewsDraftById, findNewsList } from '@lib/cms/news';

import { adjacentNews } from './lib/adjacent-news';

import type { NewsDetail } from './load-news-detail';

// The draft preview's data (port of news/preview/[id]/page.tsx): the latest draft by id
// (undefined → 404), framed by the published list's neighbours of its slug. Unlike the
// public detail, an external-link item still previews (Next did not filter it).
export const loadNewsPreview = async (id: string, previewSecret: string): Promise<NewsDetail | undefined> => {
  const item = await findNewsDraftById(id, previewSecret);
  if (item === undefined) return undefined;

  return { item, adjacent: adjacentNews(await findNewsList(), item.slug) };
};
