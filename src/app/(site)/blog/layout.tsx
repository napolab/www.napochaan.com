import { FeedLink } from '@components/feed-link';
import { PageHeader } from '@components/page-header';

import * as s from './styles.css';

import type { ReactNode } from 'react';

const crumbs = [{ href: '/', label: 'home' }, { label: 'blog' }] as const;

const BlogLayout = ({ children }: { children: ReactNode }) => (
  <main id="main-content" className={s.main}>
    <PageHeader title="blog" breadcrumbs={crumbs} kicker="// 記事" lead="あ、ほんと(発見)" />
    <FeedLink href="/blog/rss.xml" label="blog の RSS フィード" />
    {children}
  </main>
);

export default BlogLayout;
