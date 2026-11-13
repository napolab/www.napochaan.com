import { Figure } from '@components/figure';
import { formatBlurURL } from '@components/image/helper';

import type { JSXConverters } from '@payloadcms/richtext-lexical/react';

import type { NodeTypes } from '../types';

// The upload node's `fields` is a loosely-typed JsonObject in Payload's generated
// type. A non-empty `caption` there is the decorative figcaption text (distinct
// from the media doc's `alt`, which is the a11y/SEO description). Read it via a
// type guard so the Payload type is never widened or edited.
const captionOf = (fields: unknown): string | undefined => {
  if (typeof fields !== 'object' || fields === null) return undefined;
  const { caption } = fields as Record<string, unknown>;
  if (typeof caption !== 'string' || caption === '') return undefined;
  return caption;
};

/**
 * Renders Lexical upload nodes using the project's `Figure` primitive.
 * Only renders fully-populated image uploads (object value with url/width/height).
 * `alt` comes from the media doc. The corner-tag caption prefers an explicit
 * `fields.caption`, falling back to the media `alt` so a cover image is never
 * left without a label. Images use the `cover` Figure variant so a blurred copy
 * of the same image fills any letterbox gaps (matching the works thumbnail
 * look). `fit="intrinsic"` keeps small in-body images at their own size, centred
 * over the backdrop, rather than upscaling them to the 16:9 frame. `zoomable`
 * makes the body image a tap target that opens the shared gallery Lightbox.
 * Non-image uploads fall back to a download link.
 */
export type UploadFigure = {
  readonly src: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
  readonly caption: string | undefined;
};

type UploadValue = { readonly value: unknown; readonly fields?: unknown };

const uploadDocOf = (node: UploadValue): Record<string, unknown> | undefined => {
  if (typeof node.value !== 'object' || node.value === null) return undefined;
  return node.value as Record<string, unknown>;
};

/** The zoomable in-body figure an image upload renders as, or undefined for anything else. Pure. */
export const uploadFigureOf = (node: UploadValue): UploadFigure | undefined => {
  const doc = uploadDocOf(node);
  if (doc === undefined) return undefined;
  const url = typeof doc.url === 'string' ? doc.url : undefined;
  const mimeType = typeof doc.mimeType === 'string' ? doc.mimeType : '';
  if (url === undefined || !mimeType.startsWith('image')) return undefined;

  const alt = typeof doc.alt === 'string' ? doc.alt : '';
  const width = typeof doc.width === 'number' ? doc.width : 800;
  const height = typeof doc.height === 'number' ? doc.height : 450;

  return { src: url, alt, width, height, caption: captionOf(node.fields) ?? (alt === '' ? undefined : alt) };
};

export const uploadConverter: Partial<JSXConverters<NodeTypes>> = {
  upload: ({ node }) => {
    const doc = uploadDocOf(node);
    if (doc === undefined) return null;
    const url = typeof doc.url === 'string' ? doc.url : undefined;
    if (url === undefined) return null;

    const figure = uploadFigureOf(node);
    // Non-image: render a download link
    if (figure === undefined) {
      const filename = typeof doc.filename === 'string' ? doc.filename : url;
      return (
        <a href={url} rel="noopener noreferrer">
          {filename}
        </a>
      );
    }

    return (
      <Figure
        src={figure.src}
        alt={figure.alt}
        width={figure.width}
        height={figure.height}
        caption={figure.caption}
        variant="cover"
        fit="intrinsic"
        zoomable
        placeholder="blur"
        blurDataURL={formatBlurURL(figure.src, { blur: 20 })}
      />
    );
  },
};
