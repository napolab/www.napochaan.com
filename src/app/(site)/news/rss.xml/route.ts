import { toItemData } from './to-item-data';

import { findNewsList } from '@lib/payload/news';
import { createRssDocument } from '@utils/rss/create-rss-document';

import type { ChannelData } from '@utils/rss/types';

// ISR: the route reads the `news`-tagged unstable_cache, so the collection's
// revalidateTag('news') hook busts this feed automatically. At `next build` the
// build guard returns [], caching an empty-but-valid feed that ISR fills at runtime.
export const revalidate = 3600;

export const GET = async (): Promise<Response> => {
  const news = await findNewsList();
  const origin = process.env.BASE_URL ?? 'http://localhost:3000';
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

  const xml = createRssDocument({ channel, items });

  return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } });
};
