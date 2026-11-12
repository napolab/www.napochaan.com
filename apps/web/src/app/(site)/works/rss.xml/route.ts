import { findWorksList } from '@lib/payload/works';
import { createRssDocument } from '@utils/rss/create-rss-document';

import type { WorkRow } from '../_lib/work-row';
import type { ChannelData, ItemData } from '@utils/rss/types';

// Force runtime resolution (mirrors robots.ts / sitemap.ts): at `next build`
// BASE_URL is unset (would bake in `http://localhost:3000`) and the build guard
// returns [], so a prerendered feed leaks localhost with no items. Resolving
// per-request reads the real host BASE_URL and published content at runtime; the
// findWorksList() read stays cached via unstable_cache + revalidateTag('works').
export const dynamic = 'force-dynamic';

// Use the real date when available; fall back to Jan 1 of the year for year-only works.
const pubDateOf = (work: WorkRow): string => work.date ?? `${work.year}-01-01`;

const linkOf = (work: WorkRow, origin: string): string => {
  if (work.url === undefined) return `${origin}/works/${work.slug}`;
  if (work.url.startsWith('/')) return `${origin}${work.url}`;

  return work.url;
};

export const GET = async (): Promise<Response> => {
  const works = await findWorksList();
  const origin = process.env.BASE_URL ?? 'http://localhost:3000';
  const items: ItemData[] = works.map((work) => ({
    title: work.title,
    link: linkOf(work, origin),
    guid: `${origin}/works/${work.slug}`,
    pubDate: pubDateOf(work),
    category: work.type,
    description: work.description,
  }));

  const channel = {
    title: 'napochaan — works',
    link: `${origin}/works`,
    description: 'napochaan の制作アーカイブ — graphic・VJ・flyer・dev・video。',
    language: 'ja',
    selfUrl: `${origin}/works/rss.xml`,
    lastBuildDate: items[0]?.pubDate,
  } satisfies ChannelData;

  const xml = createRssDocument({ channel, items });

  return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } });
};
