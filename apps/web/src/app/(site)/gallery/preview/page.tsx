import { getCloudflareContext } from '@opennextjs/cloudflare';
import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';

import * as s from '../styles.css';

import { FeedLink } from '@components/feed-link';
import { GalleryArchive } from '@components/gallery-archive';
import { LivePreviewListener } from '@components/live-preview';
import { PageHeader } from '@components/page-header';
import { findGalleryDraftList } from '@lib/cms/gallery';

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

  // The cms gates drafts on this secret (x-preview-secret). An unset secret
  // could never pass the `/next/preview` handshake either, so treat it as 404.
  const { env } = await getCloudflareContext({ async: true });
  if (env.PREVIEW_SECRET === '') return notFound();

  const galleryPhotos = await findGalleryDraftList(env.PREVIEW_SECRET);

  return (
    <main id="main-content" className={s.main}>
      <LivePreviewListener />
      <PageHeader title="gallery" breadcrumbs={galleryCrumbs} kicker="// flyer · VRChat · photo — 2024-2026" lead="まだ知らない君がいる！" />
      <FeedLink href="/gallery/rss.xml" label="gallery の RSS フィード" />
      <section aria-label="作品ギャラリー一覧">
        <GalleryArchive photos={galleryPhotos} />
      </section>
    </main>
  );
};

export default GalleryPreviewPage;
