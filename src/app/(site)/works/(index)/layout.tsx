import { FeedLink } from '@components/feed-link';
import { PageHeader } from '@components/page-header';

import type { ReactNode } from 'react';

// The shared `<main>` lives in `works/layout.tsx`; this `(index)` layout renders
// the list chrome (header + feed link) so it appears only on the list route,
// never on `[slug]` detail or `preview`. The `<h1>` lives inside PageHeader.
const crumbs = [{ href: '/', label: 'home' }, { label: 'works' }] as const;

const WorksIndexLayout = ({ children }: { children: ReactNode }) => (
  <>
    <PageHeader title="works" breadcrumbs={crumbs} kicker="// archive — dev·vrchat·video·graphic" lead="なにかを作るって楽しいんだよなぁ〜😁" />
    <FeedLink href="/works/rss.xml" label="works の RSS フィード" />
    {children}
  </>
);

export default WorksIndexLayout;
