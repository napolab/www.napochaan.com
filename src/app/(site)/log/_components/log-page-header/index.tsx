import { LogCalendarLink } from '../log-calendar-link';
import * as styles from './styles.css';

import { FeedLink } from '@components/feed-link';
import { PageHeader } from '@components/page-header';

const crumbs = [{ href: '/', label: 'home' }, { label: 'log' }] as const;

// log 年表ページ（index / preview）のヘッダー。カレンダー単体ページは自前の
// ヘッダーを持つので、これは layout ではなく各ページから明示的に呼ぶ。
export const LogPageHeader = () => (
  <>
    <PageHeader title="log" breadcrumbs={crumbs} kicker="// 活動年表 — gig · release · work" lead="進捗どうですか？" />
    <div className={styles.metaRow}>
      <span className={styles.calendarSlot}>
        <LogCalendarLink label="活動カレンダー" />
      </span>
      <FeedLink href="/log/rss.xml" label="log の RSS フィード" />
    </div>
  </>
);
