import { FeedLink } from '@components/feed-link';
import { GalleryArchive } from '@components/gallery-archive';
import { PageHeader } from '@components/page-header';
import { findGalleryList } from '@lib/payload/gallery';

import * as s from './styles.css';

import type { Metadata } from 'next';

// Revalidate hourly so OpenNext serves the page via ISR.
export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: {
    types: {
      'application/rss+xml': [{ url: '/gallery/rss.xml', title: 'napochaan — gallery' }],
    },
  },
};

const galleryCrumbs = [{ href: '/', label: 'home' }, { label: 'gallery' }] as const;

const GalleryPage = async () => {
  const galleryPhotos = await findGalleryList();

  return (
    <main id="main-content" className={s.main}>
      <PageHeader title="gallery" breadcrumbs={galleryCrumbs} kicker="// flyer · VRChat · photo — 2024-2026" lead="まだ知らない君がいる！" />
      <FeedLink href="/gallery/rss.xml" label="gallery の RSS フィード" />
      <section aria-label="作品ギャラリー一覧">
        <GalleryArchive photos={galleryPhotos} />
      </section>
    </main>
  );
};

export default GalleryPage;
