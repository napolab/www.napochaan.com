import { createRssDocument } from '@utils/rss/create-rss-document';

import { toItemData } from '../to-item-data';

import type { NewsItem } from '../../news-item';
import type { ChannelData } from '@utils/rss/types';

// Port of `news/rss.xml/route.ts`: the published feed as RSS 2.0 (`/news/rss.xml`).
// `lastBuildDate` is the first item's date (the CMS order puts pinned items first), as
// in Next. Pure.
export const buildNewsRSS = (news: readonly NewsItem[], origin: string): string => {
  const items = news.map((item) => toItemData({ item, origin }));

  const [newest] = news;
  const channel = {
    title: 'napochaan — news',
    link: `${origin}/news`,
    description: 'napochaan のお知らせ — 制作・出演・公開のアナウンス。',
    language: 'ja',
    selfUrl: `${origin}/news/rss.xml`,
    lastBuildDate: newest?.date,
  } satisfies ChannelData;

  return createRssDocument({ channel, items });
};
