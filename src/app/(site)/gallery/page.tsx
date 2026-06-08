import { GalleryArchive } from '@components/gallery-archive';
import { galleryPhotos } from './sample-gallery';
import * as s from './styles.css';

import { PageHeader } from '@components/page-header';

// Revalidate hourly so OpenNext serves the page via ISR.
export const revalidate = 3600;

const galleryCrumbs = [{ href: '/', label: 'home' }, { label: 'gallery' }] as const;

const GalleryPage = () => {
  return (
    <main id="main-content" className={s.main}>
      <PageHeader title="gallery" breadcrumbs={galleryCrumbs} kicker="// flyer · VRChat · photo — 2024–2026" lead="やっていきを、やっていく....." />
      <section aria-label="作品ギャラリー一覧">
        <GalleryArchive photos={galleryPhotos} />
      </section>
    </main>
  );
};

export default GalleryPage;
