import { Gallery } from '@components/gallery';
import { SectionHeading } from '@components/section-heading';

import * as styles from './styles.css';

import type { GalleryArea, GalleryItem } from '@components/gallery';
import type { GalleryPhoto } from '@components/gallery-archive';

// The home teaser keeps the original fixed-template grid (not the /gallery masonry).
// Assign the first six CMS photos to the named grid areas in this order.
const AREAS: readonly GalleryArea[] = ['lead', 'wide', 'square', 'inset', 'sub', 'column'];

const toGalleryItems = (photos: readonly GalleryPhoto[]): GalleryItem[] =>
  photos.slice(0, AREAS.length).map((photo, index) => ({
    id: photo.id,
    src: photo.src,
    alt: photo.alt,
    width: photo.width,
    height: photo.height,
    caption: photo.caption,
    area: AREAS[index] ?? 'square',
  }));

type Props = {
  id?: string;
  photos: readonly GalleryPhoto[];
};

export const GallerySection = ({ id, photos }: Props) => {
  return (
    <section id={id} className={styles.root}>
      <SectionHeading no="04" href="/gallery" more="$ open gallery/" moreHref="/gallery">
        gallery
      </SectionHeading>
      <Gallery items={toGalleryItems(photos)} />
    </section>
  );
};
