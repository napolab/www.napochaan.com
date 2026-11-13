import type { LogEntry } from '../../../log/lib/build-log-timeline';
import type { TimelineItem } from '@components/timeline';

// Home log teaser entries → Timeline rows. Pure.
export const toTimelineItems = (entries: readonly LogEntry[]): TimelineItem[] =>
  entries.map((entry) => ({ id: entry.id, date: entry.date, label: entry.title, meta: entry.meta, upcoming: entry.upcoming, href: entry.href }));
