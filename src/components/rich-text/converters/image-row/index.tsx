import { Figure } from '@components/figure';
import { formatBlurURL } from '@components/image/helper';

import * as styles from './styles.css';

import type { JSXConverters } from '@payloadcms/richtext-lexical/react';

import type { NodeTypes } from '../types';

// A populated media value carries url/width/height/alt; an unpopulated one is a
// numeric id (or absent). Narrow via a type guard so the Payload type is never
// widened or edited — mirrors the upload converter's value guards.
type PopulatedImage = {
  readonly url: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
};

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const populatedImageOf = (image: unknown): PopulatedImage | undefined => {
  if (!isObject(image)) return undefined;
  const { url } = image;
  if (typeof url !== 'string') return undefined;
  const alt = typeof image.alt === 'string' ? image.alt : '';
  const width = typeof image.width === 'number' ? image.width : 800;
  const height = typeof image.height === 'number' ? image.height : 450;
  return { url, alt, width, height };
};

const captionOf = (caption: unknown, fallbackAlt: string): string | undefined => {
  if (typeof caption === 'string' && caption !== '') return caption;
  return fallbackAlt === '' ? undefined : fallbackAlt;
};

// One row cell: a cover Figure (16:9 + blurred backdrop). The caption prefers the
// cell's explicit `caption`, falling back to the media `alt` so a cover image is
// never label-less (same policy as the single-upload converter). `zoomable` makes
// the cell a tap target that opens the shared gallery Lightbox, matching the
// standalone in-body image.
const cellFigure = (image: PopulatedImage, caption: unknown, key: number): React.ReactNode => (
  <div key={key} className={styles.cellRoot}>
    <Figure
      src={image.url}
      alt={image.alt}
      width={image.width}
      height={image.height}
      caption={captionOf(caption, image.alt)}
      variant="cover"
      zoomable
      placeholder="blur"
      blurDataURL={formatBlurURL(image.url, { blur: 20 })}
    />
  </div>
);

/**
 * Renders the `image-row` lexical block: exactly two cover images side by side
 * (`src/blocks/image-row` enforces minRows/maxRows = 2). Cells whose image is not
 * a populated media object (numeric id / missing) are skipped. On a narrow
 * container the row scrolls horizontally; once wide enough the two cells share the
 * row evenly (see styles).
 */
export const imageRowBlockConverters: NonNullable<JSXConverters<NodeTypes>['blocks']> = {
  'image-row': ({ node }) => {
    const { cells } = node.fields;
    if (!Array.isArray(cells)) return null;

    const figures = cells.reduce<React.ReactNode[]>((acc, cell, index) => {
      const image = populatedImageOf(cell.image);
      if (image === undefined) return acc;
      return [...acc, cellFigure(image, cell.caption, index)];
    }, []);

    if (figures.length === 0) return null;

    return <div className={styles.root}>{figures}</div>;
  },
};
