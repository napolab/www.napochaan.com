import { Gallery } from '@components/gallery';
import { SectionHeading } from '@components/section-heading';

import * as styles from './styles.css';

import type { GalleryItem } from '@components/gallery';

type Props = {
  id?: string;
  items: GalleryItem[];
};

export const GallerySection = ({ id, items }: Props) => {
  return (
    <section id={id} className={styles.root}>
      <SectionHeading no="04" more="flyer / VRChat →" moreHref="/gallery">
        gallery
      </SectionHeading>
      <Gallery items={items} />
    </section>
  );
};
