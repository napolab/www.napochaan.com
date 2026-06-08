import { GalleryArchive } from '@components/gallery-archive';
import { SectionHeading } from '@components/section-heading';

import * as styles from './styles.css';

import type { GalleryPhoto } from '@components/gallery-archive';

type Props = {
  id?: string;
  items: GalleryPhoto[];
};

export const GallerySection = ({ id, items }: Props) => {
  return (
    <section id={id} className={styles.root}>
      <SectionHeading no="04" more="flyer / VRChat →" moreHref="/gallery">
        gallery
      </SectionHeading>
      <GalleryArchive photos={items} />
    </section>
  );
};
