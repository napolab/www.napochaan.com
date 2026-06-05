import { Image } from '@components/image';

import * as styles from './styles.css';

import type { ComponentPropsWithoutRef } from 'react';

type ImageProps = ComponentPropsWithoutRef<typeof Image>;

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
  placeholder?: ImageProps['placeholder'];
  blurDataURL?: string;
};

export const Figure = ({ src, alt, width, height, caption, placeholder, blurDataURL }: Props) => {
  return (
    <figure className={styles.root}>
      <Image src={src} alt={alt} width={width} height={height} placeholder={placeholder} blurDataURL={blurDataURL} />
      {caption !== undefined && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
};
