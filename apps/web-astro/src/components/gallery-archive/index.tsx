import { Lightbox } from '@components/gallery/lightbox';
import { Image } from '@components/image';
import { formatBlurURL } from '@components/image/helper';

import { ARCHIVE_BLUR_OPTIONS, ARCHIVE_IMAGE_SIZES, galleryArchiveLayout } from './archive-layout';
import { BlankCell } from './blank-cell';
import * as styles from './styles.css';

export type GalleryPhoto = {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  // Short corner label (e.g. 'flyer / 04.24' or 'VRChat').
  caption?: string;
};

type Props = {
  photos: readonly GalleryPhoto[];
};

// Packed three times (2 / 3 / 4 columns) on the server; CSS picks the active set per
// breakpoint (see ./archive-layout). No 'use client' — pure render. The `.astro` twin
// (./gallery-archive.astro) renders the same markup with Lightbox / BlankDim islands.

export const GalleryArchive = ({ photos }: Props) => {
  const { rootStyle, cells, blanks } = galleryArchiveLayout(photos);

  return (
    <ul className={styles.root} data-gallery style={rootStyle}>
      {cells.map(({ photo, style }) => (
        <li key={photo.id} className={styles.cell} data-photo style={style}>
          <Lightbox src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} triggerClassName={styles.trigger}>
            <Image src={photo.src} alt={photo.alt} fill sizes={ARCHIVE_IMAGE_SIZES} className={styles.image} placeholder="blur" blurDataURL={formatBlurURL(photo.src, ARCHIVE_BLUR_OPTIONS)} />
          </Lightbox>
          {photo.caption !== undefined ? <span className={styles.caption}>{photo.caption}</span> : null}
        </li>
      ))}
      {blanks.map(({ key, blank, bp, index }) => (
        <BlankCell key={key} blank={blank} bp={bp} index={index} />
      ))}
    </ul>
  );
};
