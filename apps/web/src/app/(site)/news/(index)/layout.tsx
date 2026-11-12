import { FeedLink } from '@components/feed-link';
import { PageHeader } from '@components/page-header';

import type { ReactNode } from 'react';

// The shared `<main>` lives in `news/layout.tsx`; this `(index)` layout renders
// the list chrome (header + feed link) so it appears only on the list route,
// never on `[slug]` detail or `preview`. The `<h1>` lives inside PageHeader.
const crumbs = [{ href: '/', label: 'home' }, { label: 'news' }] as const;

const NewsIndexLayout = ({ children }: { children: ReactNode }) => (
  <>
    <PageHeader title="news" breadcrumbs={crumbs} kicker="// お知らせ" lead="近況すぎ〜↑" />
    <FeedLink href="/news/rss.xml" label="news の RSS フィード" />
    {children}
  </>
);

export default NewsIndexLayout;
