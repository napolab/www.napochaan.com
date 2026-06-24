import { FeedLink } from '@components/feed-link';
import { PageHeader } from '@components/page-header';

import type { ReactNode } from 'react';

// The shared `<main>` lives in `blog/layout.tsx`; this `(index)` layout renders
// the list chrome (header + feed link) so it appears only on the list route,
// never on `[slug]` detail or `preview`. The `<h1>` lives inside PageHeader.
const crumbs = [{ href: '/', label: 'home' }, { label: 'blog' }] as const;

const BlogIndexLayout = ({ children }: { children: ReactNode }) => (
  <>
    <PageHeader title="blog" breadcrumbs={crumbs} kicker="// 記事" lead="あ、ほんと(発見)" />
    <FeedLink href="/blog/rss.xml" label="blog の RSS フィード" />
    {children}
  </>
);

export default BlogIndexLayout;
