import { FeedLink } from '@components/feed-link';
import { PageHeader } from '@components/page-header';

import * as s from './styles.css';

import type { ReactNode } from 'react';

const crumbs = [{ href: '/', label: 'home' }, { label: 'news' }] as const;

const NewsLayout = ({ children }: { children: ReactNode }) => (
  <main id="main-content" className={s.main}>
    <PageHeader title="news" breadcrumbs={crumbs} kicker="// お知らせ" lead="近況すぎ〜↑" />
    <FeedLink href="/news/rss.xml" label="news の RSS フィード" />
    {children}
  </main>
);

export default NewsLayout;
