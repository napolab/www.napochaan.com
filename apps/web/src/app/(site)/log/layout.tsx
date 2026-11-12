import { Suspense } from 'react';

import { LogCalendarSection } from './_components/log-calendar-section';
import * as s from './styles.css';

import { FeedLink } from '@components/feed-link';
import { PageHeader } from '@components/page-header';

import type { ReactNode } from 'react';

const crumbs = [{ href: '/', label: 'home' }, { label: 'log' }] as const;

const LogLayout = ({ children }: { children: ReactNode }) => (
  <main id="main-content" className={s.main}>
    <PageHeader title="log" breadcrumbs={crumbs} kicker="// 活動年表 — gig · release · work" lead="進捗どうですか？" />
    <div className={s.metaRow}>
      {/* metaRow は右寄せなので fallback=null でも FeedLink は動かない（カレンダーは
          左側に後から現れるだけ）。layout 配下は log/error.tsx が捕捉できないため、
          取得失敗時は LogCalendarSection が catch して null を返し黙って消える。 */}
      <span className={s.calendarSlot}>
        <Suspense fallback={null}>
          <LogCalendarSection />
        </Suspense>
      </span>
      <FeedLink href="/log/rss.xml" label="log の RSS フィード" />
    </div>
    {children}
  </main>
);

export default LogLayout;
