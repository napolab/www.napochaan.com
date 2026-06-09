import { FeedLink } from '@components/feed-link';
import { PageHeader } from '@components/page-header';

import * as s from './styles.css';

import type { ReactNode } from 'react';

const crumbs = [{ href: '/', label: 'home' }, { label: 'works' }] as const;

const WorksLayout = ({ children }: { children: ReactNode }) => (
  <main id="main-content" className={s.main}>
    <PageHeader title="works" breadcrumbs={crumbs} kicker="// archive — dev·vrchat·video·graphic" lead="なにかを作るって楽しいんだよなぁ〜😁" />
    <FeedLink href="/works/rss.xml" label="works の RSS フィード" />
    {children}
  </main>
);

export default WorksLayout;
