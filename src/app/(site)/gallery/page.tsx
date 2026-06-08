import { GalleryArchive } from '@components/gallery-archive';
import { PageHeader } from '@components/page-header';
import { findGalleryList } from '@lib/payload/gallery';

import * as s from './styles.css';

// Revalidate hourly so OpenNext serves the page via ISR.
export const revalidate = 3600;

const galleryCrumbs = [{ href: '/', label: 'home' }, { label: 'gallery' }] as const;

const GalleryPage = async () => {
  const galleryPhotos = await findGalleryList();
  // GalleryArchive expects mutable GalleryPhoto[]; spread from readonly.
  const photos = [...galleryPhotos];

  return (
    <main id="main-content" className={s.main}>
      <PageHeader title="gallery" breadcrumbs={galleryCrumbs} kicker="// flyer · VRChat · photo — 2024–2026" lead="やっていきを、やっていく....." />
      <section aria-label="作品ギャラリー一覧">
        <GalleryArchive photos={photos} />
      </section>
    </main>
  );
};

export default GalleryPage;
