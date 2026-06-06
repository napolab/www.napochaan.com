import { Gallery } from '@components/gallery';
import { SectionHeading } from '@components/section-heading';

import * as styles from './styles.css';

import type { GalleryItem } from '@components/gallery';

type Props = {
  items: GalleryItem[];
};

export const GallerySection = ({ items }: Props) => {
  return (
    <section className={styles.root}>
      <SectionHeading no="04">gallery</SectionHeading>
      <Gallery items={items} />
    </section>
  );
};
