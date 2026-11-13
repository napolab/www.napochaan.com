import { createRssDocument } from '@utils/rss/create-rss-document';

import type { WorkRow } from '../../work-row';
import type { ChannelData, ItemData } from '@utils/rss/types';

// Use the real date when available; fall back to Jan 1 of the year for year-only works.
const pubDateOf = (work: WorkRow): string => work.date ?? `${work.year}-01-01`;

// RSS `<link>` MUST be absolute: an internal relative override resolves against the
// origin, an external url is used as-is, and no url falls back to the permalink.
const linkOf = (work: WorkRow, origin: string): string => {
  if (work.url === undefined) return `${origin}/works/${work.slug}`;
  if (work.url.startsWith('/')) return `${origin}${work.url}`;

  return work.url;
};

// Port of `works/rss.xml/route.ts`: the archive as RSS 2.0 (`/works/rss.xml`). Pure.
export const buildWorksRSS = (works: readonly WorkRow[], origin: string): string => {
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

  return createRssDocument({ channel, items });
};
