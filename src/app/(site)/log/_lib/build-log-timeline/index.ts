import { dayjs } from '@utils/dayjs';

import type { LogManualItem } from '../log-manual-item';
import type { ExternalPost } from '../external-feeds';
import type { NewsItem } from '../../../news/_lib/news-item';
import type { WorkRow } from '../../../works/_lib/work-row';

// A single row on the activity chronicle. The shape mirrors the timeline's needs
// exactly — no internal sort keys leak out (those stay in the local row below).
export type LogEntry = {
  id: string;
  year: number;
  date: string;
  meta: string;
  title: string;
  upcoming: boolean;
  // Optional link for the title — only set when the source item carries a `url`
  // (internal path like `/works/3` or an external URL). Absent → the title is
  // plain text. The Timeline derives external-ness from the string itself, so no
  // separate flag is stored here.
  href?: string;
};

export type LogYearGroup = {
  year: number;
  items: LogEntry[];
};

// Internal row carries the real ISO date so news can be ordered precisely within
// a year; works carry an empty sort key so they fall after the dated news while
// keeping their source order (stable sort).
type SortableEntry = LogEntry & { sortDate: string };

// Live + release news are the only announcement categories that count as
// chronicle activity. Site/blog announcements are excluded.
const isChronicleNews = (item: NewsItem): boolean => item.category === 'live' || item.category === 'release';

const toNewsEntry = (item: NewsItem, now: string): SortableEntry => {
  const at = dayjs(item.date).tz('Asia/Tokyo');
  const today = dayjs(now).tz('Asia/Tokyo');

  return {
    id: `news-${item.id}`,
    year: at.year(),
    date: at.format('MM.DD'),
    meta: item.category,
    title: item.title,
    // Strictly after now, compared at day precision in Asia/Tokyo.
    upcoming: at.startOf('day').isAfter(today.startOf('day')),
    href: item.url,
    sortDate: item.date,
  };
};

// External blog posts are dated, so they sort alongside news by sortDate. The
// feed source (`zenn` / `sizu`) becomes the meta label and the article URL the href.
const toPostEntry = (post: ExternalPost): SortableEntry => {
  const at = dayjs(post.date).tz('Asia/Tokyo');

  return {
    id: `post-${post.id}`,
    year: at.year(),
    date: at.format('MM.DD'),
    meta: post.source,
    title: post.title,
    upcoming: false,
    href: post.link,
    sortDate: post.date,
  };
};

const toWorkEntry = (work: WorkRow): SortableEntry => {
  const at = work.date !== undefined ? dayjs(work.date).tz('Asia/Tokyo') : undefined;

  return {
    id: `work-${work.id}`,
    year: work.year,
    date: at !== undefined ? at.format('MM.DD') : '—',
    meta: work.type,
    title: work.title,
    upcoming: false,
    href: work.url,
    sortDate: work.date ?? '',
  };
};

// Manual log entries are dated, so they sort alongside news/posts by sortDate.
const toManualEntry = (item: LogManualItem): SortableEntry => {
  const at = dayjs(item.date).tz('Asia/Tokyo');

  return {
    id: `log-${item.id}`,
    year: at.year(),
    date: at.format('MM.DD'),
    meta: item.meta,
    title: item.title,
    upcoming: false,
    href: item.url,
    sortDate: item.date,
  };
};

// Newest sortDate first; entries with an empty sortDate (works) sort last. The
// underlying sort is stable, so equal-key works keep their source order.
const bySortDateDesc = (a: SortableEntry, b: SortableEntry): number => (a.sortDate < b.sortDate ? 1 : a.sortDate > b.sortDate ? -1 : 0);

const stripSortKey = ({ sortDate: _sortDate, ...entry }: SortableEntry): LogEntry => entry;

// Collapse entries that point at the same source URL — a 制作実績 is often ALSO seeded
// as a curated news announcement and/or a manual gig log, and all three carry the same
// tweet/repo `href`. Without this the chronicle shows the same event two or three times.
// First occurrence wins; the caller orders works ahead of news/posts/logs so the work's
// accurate type label is the one kept. Entries without an href are always kept (no key).
const dedupeByHref = (entries: readonly SortableEntry[]): SortableEntry[] => {
  const seen = new Set<string>();

  return entries.reduce<SortableEntry[]>((acc, entry) => {
    if (entry.href !== undefined && seen.has(entry.href)) return acc;
    if (entry.href !== undefined) seen.add(entry.href);

    return [...acc, entry];
  }, []);
};

// Merge news (live/release only), external blog posts, all works, and manual log
// entries into a single chronicle grouped by year, newest year first. Within a year:
// dated news, posts, and manual entries (date desc) precede works. The `logs` param
// defaults to [] so existing 4-arg callers continue to compile unchanged.
// Pure — inputs are never mutated.
export const buildLogTimeline = (news: readonly NewsItem[], works: readonly WorkRow[], posts: readonly ExternalPost[], now: string, logs: readonly LogManualItem[] = []): LogYearGroup[] => {
  const newsEntries = news.filter(isChronicleNews).map((item) => toNewsEntry(item, now));
  const postEntries = posts.map(toPostEntry);
  const workEntries = works.map(toWorkEntry);
  const manualEntries = logs.map(toManualEntry);
  // Works first so the canonical 制作実績 entry (accurate type label) wins when the same
  // item is also seeded as a news announcement or a manual gig log (matched by href).
  const entries = dedupeByHref([...workEntries, ...newsEntries, ...postEntries, ...manualEntries]);

  const buckets = entries.reduce<Map<number, SortableEntry[]>>((acc, entry) => {
    const existing = acc.get(entry.year) ?? [];

    return acc.set(entry.year, [...existing, entry]);
  }, new Map());

  return [...buckets.keys()]
    .sort((a, b) => b - a)
    .map((year) => ({
      year,
      items: [...(buckets.get(year) ?? [])].sort(bySortDateDesc).map(stripSortKey),
    }));
};
