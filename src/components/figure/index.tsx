import { Image } from '@components/image';
import { formatBlurURL } from '@components/image/helper';

import * as styles from './styles.css';

import type { ComponentPropsWithoutRef, CSSProperties } from 'react';

type ImageProps = ComponentPropsWithoutRef<typeof Image>;

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
  placeholder?: ImageProps['placeholder'];
  blurDataURL?: string;
  // 'plain' (default): the contained image letterboxes over a transparent backdrop
  // and the caption sits in a bottom figcaption — the in-body / proof-sheet look.
  // 'cover': a heavily-blurred cover-cropped copy of the image fills the letterbox
  // gaps so the page behind never shows through, and the caption renders as a
  // gallery-style solid corner tag pinned to the frame.
  variant?: 'plain' | 'cover';
};

// Cover-variant backdrop source: a tiny, heavily-blurred copy of the same image,
// handed to the decorative layer as a CSS var so it can paint it cover-cropped.
const backdropStyle = (src: string): CSSProperties => ({ '--figure-backdrop': `url(${formatBlurURL(src, { blur: 40, width: 96, quality: 40 })})` }) as CSSProperties;

export const Figure = ({ src, alt, width, height, caption, placeholder, blurDataURL, variant = 'plain' }: Props) => {
  const captionClassName = variant === 'cover' ? styles.tag : styles.caption;

  return (
    <figure className={styles.root} data-variant={variant}>
      {variant === 'cover' ? <span className={styles.backdrop} aria-hidden="true" style={backdropStyle(src)} /> : null}
      <Image src={src} alt={alt} width={width} height={height} placeholder={placeholder} blurDataURL={blurDataURL} className={styles.image} />
      {caption === undefined ? null : <figcaption className={captionClassName}>{caption}</figcaption>}
    </figure>
  );
};
