import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';

import * as s from '../styles.css';

import { FeedLink } from '@components/feed-link';
import { GalleryArchive } from '@components/gallery-archive';
import { LivePreviewListener } from '@components/live-preview';
import { PageHeader } from '@components/page-header';
import { findGalleryDraftList } from '@lib/payload/gallery';

// Draft-only Live Preview route. Always dynamic — it must refetch the latest
// drafts on every request (autosave streams edits) and is never prerendered or
// cached. Reachable only after the secret-gated handshake at `/next/preview`
// enables draft mode; without it, `isEnabled` is false and we 404 so drafts
// never leak. Gallery is an aggregate page, so this previews the whole list
// rather than a single entry.
export const dynamic = 'force-dynamic';

const galleryCrumbs = [{ href: '/', label: 'home' }, { label: 'gallery' }] as const;

const GalleryPreviewPage = async () => {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return notFound();

  const galleryPhotos = await findGalleryDraftList();

  return (
    <main id="main-content" className={s.main}>
      <LivePreviewListener />
      <PageHeader title="gallery" breadcrumbs={galleryCrumbs} kicker="// flyer · VRChat · photo — 2024–2026" lead="やっていきを、やっていく....." />
      <FeedLink href="/gallery/rss.xml" label="gallery の RSS フィード" />
      <section aria-label="作品ギャラリー一覧">
        <GalleryArchive photos={galleryPhotos} />
      </section>
    </main>
  );
};

export default GalleryPreviewPage;
