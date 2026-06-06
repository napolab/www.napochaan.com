import { SectionHeading } from '@components/section-heading';
import { Timeline } from '@components/timeline';

import * as styles from './styles.css';

import type { TimelineItem } from '@components/timeline';

// Activity chronicle (年表): any notable activity over time — gigs, releases,
// works… (not just performances). See the news-vs-log content rule.
type LogEntry = {
  id: string;
  date: string;
  title: string;
  meta?: string;
  upcoming?: boolean;
};

type Props = {
  id?: string;
  entries: LogEntry[];
};

const toTimelineItems = (entries: LogEntry[]): TimelineItem[] => entries.map((entry) => ({ id: entry.id, date: entry.date, label: entry.title, meta: entry.meta, upcoming: entry.upcoming }));

export const LogSection = ({ id, entries }: Props) => {
  return (
    <section id={id} className={styles.root}>
      <SectionHeading no="03" more="活動年表 →" moreHref="/log">
        log
      </SectionHeading>
      <Timeline items={toTimelineItems(entries)} />
    </section>
  );
};
