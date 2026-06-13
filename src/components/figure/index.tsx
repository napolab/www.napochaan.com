import { Lightbox } from '@components/gallery/lightbox';
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
  // 'fill' (default): the image is sized to the 16:9 frame as before.
  // 'intrinsic' (cover only): the frame keeps 16:9, but a source smaller than the
  // frame renders at its own intrinsic size, centred over the blurred backdrop;
  // a larger source still scales down to fit the frame.
  fit?: 'fill' | 'intrinsic';
  // When true, the image becomes a tap target that opens the shared gallery
  // Lightbox overlay (accent frame + zoom-in cursor on hover/focus). Set only by
  // the richtext upload converter — the detail-hero usage leaves it false so the
  // hero stays non-interactive.
  zoomable?: boolean;
};

// Cover-variant backdrop source: a tiny, heavily-blurred copy of the same image,
// handed to the decorative layer as a CSS var so it can paint it cover-cropped.
const backdropStyle = (src: string): CSSProperties => ({ '--figure-backdrop': `url(${formatBlurURL(src, { blur: 40, width: 96, quality: 40 })})` }) as CSSProperties;

// Intrinsic fit caps the frame at the source's real width via this CSS var; fill leaves it unset.
const figureWidthStyle = (fit: Props['fit'], width: number): CSSProperties | undefined => (fit === 'intrinsic' ? ({ '--figure-width': `${width}px` } as CSSProperties) : undefined);

export const Figure = ({ src, alt, width, height, caption, placeholder, blurDataURL, variant = 'plain', fit = 'fill', zoomable = false }: Props) => {
  const captionClassName = variant === 'cover' ? styles.tag : styles.caption;
  const image = <Image src={src} alt={alt} width={width} height={height} placeholder={placeholder} blurDataURL={blurDataURL} className={styles.image} />;

  return (
    <figure className={styles.root} data-variant={variant} data-fit={fit} style={figureWidthStyle(fit, width)}>
      {variant === 'cover' ? <span className={styles.backdrop} aria-hidden="true" style={backdropStyle(src)} /> : null}
      {zoomable ? (
        <Lightbox src={src} alt={alt} width={width} height={height} triggerClassName={styles.trigger}>
          {image}
        </Lightbox>
      ) : (
        image
      )}
      {caption === undefined ? null : <figcaption className={captionClassName}>{caption}</figcaption>}
    </figure>
  );
};
