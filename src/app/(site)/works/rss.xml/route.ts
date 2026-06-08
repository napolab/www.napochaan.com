import { findWorksList } from '@lib/payload/works';
import { createRssDocument } from '@utils/rss/create-rss-document';

import type { WorkRow } from '../_lib/work-row';
import type { ChannelData, ItemData } from '@utils/rss/types';

// ISR: the route reads the `works`-tagged unstable_cache, so the collection's
// revalidateTag('works') hook busts this feed automatically.
export const revalidate = 3600;

// Works carry year-precision only; use Jan 1 of the year as a stable pubDate.
const pubDateOf = (work: WorkRow): string => `${work.year}-01-01`;

const linkOf = (work: WorkRow, origin: string): string => {
  if (work.url === undefined) return `${origin}/works/${work.id}`;
  if (work.url.startsWith('/')) return `${origin}${work.url}`;

  return work.url;
};

export const GET = async (): Promise<Response> => {
  const works = await findWorksList();
  const origin = process.env.BASE_URL ?? 'http://localhost:3000';
  const items: ItemData[] = works.map((work) => ({
    title: work.title,
    link: linkOf(work, origin),
    guid: `${origin}/works/${work.id}`,
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
