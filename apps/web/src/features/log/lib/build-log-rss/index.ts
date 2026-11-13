import { createRssDocument } from '@utils/rss/create-rss-document';

import type { LogEntry, LogYearGroup } from '../build-log-timeline';
import type { ChannelData, ItemData } from '@utils/rss/types';

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

const toItems = (group: LogYearGroup, origin: string): ItemData[] =>
  group.items.map((entry) => ({
    title: entry.title,
    link: linkOf(entry, origin),
    guid: `${origin}/log#${entry.id}`,
    pubDate: pubDateOf(group.year, entry.date),
    category: entry.meta,
  }));

// Port of `log/rss.xml/route.ts`: the activity chronicle as RSS 2.0 (`/log/rss.xml`).
// `lastBuildDate` is the first entry's date, as in Next. Pure.
export const buildLogRSS = (groups: readonly LogYearGroup[], origin: string): string => {
  const items = groups.flatMap((group) => toItems(group, origin));

  const channel = {
    title: 'napochaan — log',
    link: `${origin}/log`,
    description: 'napochaan の活動年表 — gig・release・work・milestone。',
    language: 'ja',
    selfUrl: `${origin}/log/rss.xml`,
    lastBuildDate: items[0]?.pubDate,
  } satisfies ChannelData;

  return createRssDocument({ channel, items });
};
