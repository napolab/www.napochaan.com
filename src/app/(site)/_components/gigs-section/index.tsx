import { SectionHeading } from '@components/section-heading';
import { Timeline } from '@components/timeline';

import * as styles from './styles.css';

import type { TimelineItem } from '@components/timeline';

type Gig = {
  id: string;
  date: string;
  event: string;
  venue?: string;
  upcoming?: boolean;
};

type Props = {
  gigs: Gig[];
};

const toTimelineItems = (gigs: Gig[]): TimelineItem[] => gigs.map((gig) => ({ id: gig.id, date: gig.date, label: gig.event, meta: gig.venue, upcoming: gig.upcoming }));

export const GigsSection = ({ gigs }: Props) => {
  return (
    <section className={styles.root}>
      <SectionHeading no="03">gigs</SectionHeading>
      <Timeline items={toTimelineItems(gigs)} />
    </section>
  );
};
