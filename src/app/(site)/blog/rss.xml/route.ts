import { findBlogList } from '@lib/payload/blog';
import { createRssDocument } from '@utils/rss/create-rss-document';

import type { ChannelData, ItemData } from '@utils/rss/types';

// ISR: the route reads the `blog`-tagged unstable_cache, so the collection's
// revalidateTag('blog') hook busts this feed automatically.
export const revalidate = 3600;

export const GET = async (): Promise<Response> => {
  const posts = await findBlogList();
  const origin = process.env.BASE_URL ?? 'http://localhost:3000';
  const items: ItemData[] = posts.map((post) => ({
    title: post.title,
    link: `${origin}/blog/${post.id}`,
    guid: `${origin}/blog/${post.id}`,
    pubDate: post.date,
    category: post.source,
    description: post.excerpt,
  }));

  const [newest] = posts;
  const channel = {
    title: 'napochaan — blog',
    link: `${origin}/blog`,
    description: 'napochaan のブログ — 制作・技術・日々の記録。',
    language: 'ja',
    selfUrl: `${origin}/blog/rss.xml`,
    lastBuildDate: newest?.date,
  } satisfies ChannelData;

  const xml = createRssDocument({ channel, items });

  return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } });
};
