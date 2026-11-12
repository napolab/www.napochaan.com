import { findBlogList } from '@lib/payload/blog';
import { createRssDocument } from '@utils/rss/create-rss-document';

import type { ChannelData, ItemData } from '@utils/rss/types';

// Force runtime resolution (mirrors robots.ts / sitemap.ts): at `next build`
// BASE_URL is unset (would bake in `http://localhost:3000`) and the build guard
// returns [], so a prerendered feed leaks localhost with no items. Resolving
// per-request reads the real host BASE_URL and published content at runtime; the
// findBlogList() read stays cached via unstable_cache + revalidateTag('blog').
export const dynamic = 'force-dynamic';

export const GET = async (): Promise<Response> => {
  const posts = await findBlogList();
  const origin = process.env.BASE_URL ?? 'http://localhost:3000';
  const items: ItemData[] = posts.map((post) => ({
    title: post.title,
    link: `${origin}/blog/${post.slug}`,
    guid: `${origin}/blog/${post.slug}`,
    pubDate: post.date,
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
