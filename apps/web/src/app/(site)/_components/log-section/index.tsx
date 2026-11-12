import { SectionHeading } from '@components/section-heading';
import { Timeline } from '@components/timeline';

import * as styles from './styles.css';

import type { LogEntry } from '../../log/_lib/build-log-timeline';
import type { TimelineItem } from '@components/timeline';

type Props = {
  id?: string;
  entries: readonly LogEntry[];
};

const toTimelineItems = (entries: readonly LogEntry[]): TimelineItem[] =>
  entries.map((entry) => ({ id: entry.id, date: entry.date, label: entry.title, meta: entry.meta, upcoming: entry.upcoming, href: entry.href }));

export const LogSection = ({ id, entries }: Props) => {
  return (
    <section id={id} className={styles.root}>
      <SectionHeading no="03" href="/log" more="$ git log" moreHref="/log">
        log
      </SectionHeading>
      <Timeline items={toTimelineItems(entries)} />
    </section>
  );
};
