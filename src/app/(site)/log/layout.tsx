import { FeedLink } from '@components/feed-link';
import { PageHeader } from '@components/page-header';

import * as s from './styles.css';

import type { ReactNode } from 'react';

const crumbs = [{ href: '/', label: 'home' }, { label: 'log' }] as const;

const LogLayout = ({ children }: { children: ReactNode }) => (
  <main id="main-content" className={s.main}>
    <PageHeader title="log" breadcrumbs={crumbs} kicker="// 活動年表 — gig · release · work" lead="進捗どうですか？" />
    <FeedLink href="/log/rss.xml" label="log の RSS フィード" />
    {children}
  </main>
);

export default LogLayout;
