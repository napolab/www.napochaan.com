import { Timeline } from '@components/timeline';

import * as styles from './styles.css';

import type { LogEntry, LogYearGroup } from '../../_lib/build-log-timeline';
import type { TimelineItem } from '@components/timeline';

type Props = {
  groups: readonly LogYearGroup[];
};

const toTimelineItems = (entries: readonly LogEntry[]): TimelineItem[] =>
  entries.map((entry) => ({ id: entry.id, date: entry.date, label: entry.title, meta: entry.meta, upcoming: entry.upcoming, href: entry.href }));

// Full-page activity chronicle: one section per year (newest first), each with a
// year heading followed by that year's merged news + works timeline.
export const LogTimeline = ({ groups }: Props) => {
  return (
    <div className={styles.root}>
      {groups.map((group) => (
        <section key={group.year} className={styles.yearRoot}>
          <h2 className={styles.year}>{group.year}</h2>
          <Timeline items={toTimelineItems(group.items)} />
        </section>
      ))}
    </div>
  );
};
