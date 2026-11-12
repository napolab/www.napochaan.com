import { dayjs } from '@utils/dayjs';

import type { LogManualItem } from '../log-manual-item';
import type { ExternalPost } from '../external-feeds';
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

// Internal row carries the real ISO date so dated entries can be ordered precisely
// within a year; works carry an empty sort key so they fall after the dated entries
// while keeping their source order (stable sort).
type SortableEntry = LogEntry & { sortDate: string };

// External blog posts are dated, so they sort alongside posts by sortDate. The
// feed source (`zenn` / `sizu`) becomes the meta label and the article URL the href.
const toPostEntry = (post: ExternalPost): SortableEntry => {
  const at = dayjs(post.date).tz('Asia/Tokyo');

  return {
    id: `post-${post.id}`,
    year: at.year(),
    date: at.format('MM.DD (ddd)'),
    meta: post.source,
    title: post.title,
    upcoming: false,
    href: post.link,
    sortDate: post.date,
  };
};

// A work links to its own /works/{slug} detail page (not its external source url),
// per "works があるものは works に飛ぶ". The title is shown verbatim — any trailing
// phrasing (作成 / 提供 / 登壇 …) is authored into the work's title in the CMS, not here.
const toWorkEntry = (work: WorkRow): SortableEntry => {
  const at = work.date !== undefined ? dayjs(work.date).tz('Asia/Tokyo') : undefined;

  return {
    id: `work-${work.id}`,
    year: work.year,
    date: at !== undefined ? at.format('MM.DD (ddd)') : '—',
    meta: work.type,
    title: work.title,
    upcoming: false,
    href: `/works/${work.slug}`,
    sortDate: work.date ?? '',
  };
};

// Manual log entries are dated, so they sort alongside posts by sortDate.
// A gig whose day (day precision, Asia/Tokyo) is today or later is `upcoming`, which
// the timeline renders with a filled dot. It only stops being upcoming once its day
// has fully passed — an event stays upcoming through the whole of its own day.
const toManualEntry = (item: LogManualItem, now: string): SortableEntry => {
  const at = dayjs(item.date).tz('Asia/Tokyo');
  const today = dayjs(now).tz('Asia/Tokyo');

  return {
    id: `log-${item.id}`,
    year: at.year(),
    date: at.format('MM.DD (ddd)'),
    meta: item.meta,
    title: item.title,
    upcoming: !at.startOf('day').isBefore(today.startOf('day')),
    href: item.url,
    sortDate: item.date,
  };
};

// Newest sortDate first; entries with an empty sortDate (works) sort last. The
// underlying sort is stable, so equal-key works keep their source order.
const bySortDateDesc = (a: SortableEntry, b: SortableEntry): number => (a.sortDate < b.sortDate ? 1 : a.sortDate > b.sortDate ? -1 : 0);

const stripSortKey = ({ sortDate: _sortDate, ...entry }: SortableEntry): LogEntry => entry;

// Merge external blog posts, all works, and manual log entries into a single
// chronicle grouped by year, newest year first. Within a year: dated posts and
// manual entries (date desc) precede works. News is excluded — it lives on /news
// only. The `logs` param defaults to [] so existing callers continue to compile.
// Pure — inputs are never mutated.
export const buildLogTimeline = (works: readonly WorkRow[], posts: readonly ExternalPost[], now: string, logs: readonly LogManualItem[] = []): LogYearGroup[] => {
  const postEntries = posts.map(toPostEntry);
  const workEntries = works.map(toWorkEntry);
  const manualEntries = logs.map((item) => toManualEntry(item, now));
  const entries = [...workEntries, ...postEntries, ...manualEntries];

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
