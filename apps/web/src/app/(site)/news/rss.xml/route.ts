import { toItemData } from './to-item-data';

import { findNewsList } from '@lib/payload/news';
import { createRssDocument } from '@utils/rss/create-rss-document';

import type { ChannelData } from '@utils/rss/types';

// Force runtime resolution (mirrors robots.ts / sitemap.ts): at `next build`
// BASE_URL is unset (would bake in `http://localhost:3000`) and the build guard
// returns [], so a prerendered feed leaks localhost with no items. Resolving
// per-request reads the real host BASE_URL and published content at runtime; the
// findNewsList() read stays cached via unstable_cache + revalidateTag('news').
export const dynamic = 'force-dynamic';

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
