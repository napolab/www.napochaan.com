import { buildLogTimeline } from '../_lib/build-log-timeline';
import { fetchExternalPosts } from '../_lib/fetch-external-posts';

import { findLogList } from '@lib/payload/logs';
import { findWorksList } from '@lib/payload/works';
import { createRssDocument } from '@utils/rss/create-rss-document';
import { dayjs } from '@utils/dayjs';

import type { LogEntry } from '../_lib/build-log-timeline';
import type { ChannelData, ItemData } from '@utils/rss/types';

// Force runtime resolution (mirrors robots.ts / sitemap.ts): at `next build`
// BASE_URL is unset (would bake in `http://localhost:3000`) and the build guards
// return [], so a prerendered feed leaks localhost with no items. Resolving
// per-request reads the real host BASE_URL and rebuilds the timeline at runtime;
// the contributing reads stay cached via unstable_cache + their revalidateTag hooks.
export const dynamic = 'force-dynamic';

const linkOf = (entry: LogEntry, origin: string): string => {
  if (entry.href === undefined) return `${origin}/log`;
  if (entry.href.startsWith('/')) return `${origin}${entry.href}`;

  return entry.href;
};

// Reconstruct an ISO pubDate from the year + 'MM.DD' display date. Works rows use
// '—' (no day); fall back to Jan 1 of the year.
const pubDateOf = (year: number, date: string): string => {
  if (date === '—') return `${year}-01-01`;
  const [month, day] = date.split('.');

  return `${year}-${month}-${day}`;
};

export const GET = async (): Promise<Response> => {
  const origin = process.env.BASE_URL ?? 'http://localhost:3000';
  const works = await findWorksList();
  const posts = await fetchExternalPosts();
  const logs = await findLogList();
  const now = dayjs().tz('Asia/Tokyo').toISOString();
  const groups = buildLogTimeline(works, posts, now, logs);

  const items: ItemData[] = groups.flatMap((group) =>
    group.items.map((entry) => ({
      title: entry.title,
      link: linkOf(entry, origin),
      guid: `${origin}/log#${entry.id}`,
      pubDate: pubDateOf(group.year, entry.date),
      category: entry.meta,
    })),
  );

  const channel = {
    title: 'napochaan — log',
    link: `${origin}/log`,
    description: 'napochaan の活動年表 — gig・release・work・milestone。',
    language: 'ja',
    selfUrl: `${origin}/log/rss.xml`,
    lastBuildDate: items[0]?.pubDate,
  } satisfies ChannelData;

  const xml = createRssDocument({ channel, items });

  return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } });
};
