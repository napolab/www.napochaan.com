import { FeedLink } from '@components/feed-link';
import { PageHeader } from '@components/page-header';

import * as s from './styles.css';

import type { ReactNode } from 'react';

const galleryCrumbs = [{ href: '/', label: 'home' }, { label: 'gallery' }] as const;

const GalleryLayout = ({ children }: { children: ReactNode }) => {
  return (
    <main id="main-content" className={s.main}>
      <PageHeader title="gallery" breadcrumbs={galleryCrumbs} kicker="// flyer · VRChat · photo — 2024-2026" lead="まだ知らない君がいる！" />
      <FeedLink href="/gallery/rss.xml" label="gallery の RSS フィード" />
      {children}
    </main>
  );
};

export default GalleryLayout;
