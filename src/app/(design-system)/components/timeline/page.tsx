import { css } from '@styled/css';

import { Timeline } from '@components/timeline';

import type { TimelineItem } from '@components/timeline';

const wrap = css({ display: 'flex', flexDirection: 'column', gap: 'block', p: 'page' });
const heading = css({ fontFamily: 'display', fontSize: 'h2' });
const sectionHeading = css({ fontFamily: 'mono', fontSize: 'xs', color: 'fg.muted', mb: '4', letterSpacing: 'wide', textTransform: 'uppercase' });

const items: TimelineItem[] = [
  { id: '1', date: '06/14', label: 'night vol.19 @ club eleven', meta: 'Tokyo', upcoming: true },
  { id: '2', date: '06/28', label: 'techno marathon @ warehouse', upcoming: true },
  { id: '3', date: '05/03', label: 'dawn session @ rooftop', meta: 'DJ set' },
  { id: '4', date: '04/12', label: 'ambient night @ gallery', meta: 'live' },
  { id: '5', date: '03/22', label: 'opening set @ festival', meta: 'Osaka' },
];

const TimelineShowcase = () => {
  return (
    <main className={wrap}>
      <h1 className={heading}>Timeline</h1>
      <section aria-label="Gig history">
        <p className={sectionHeading}>events — upcoming highlighted in accent</p>
        <Timeline items={items} />
      </section>
    </main>
  );
};

export default TimelineShowcase;
