import { createRssDocument } from '@utils/rss/create-rss-document';

import type { Post } from '../../post';
import type { ChannelData, ItemData } from '@utils/rss/types';

// Port of `blog/rss.xml/route.ts`: the published feed as RSS 2.0 (`/blog/rss.xml`). Pure.
export const buildBlogRSS = (posts: readonly Post[], origin: string): string => {
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

  return createRssDocument({ channel, items });
};
