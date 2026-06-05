import { Figure } from '@components/figure';

import type { JSXConverters } from '@payloadcms/richtext-lexical/react';

import type { NodeTypes } from '../types';

/**
 * Renders Lexical upload nodes using the project's `Figure` primitive.
 * Only renders fully-populated image uploads (object value with url/width/height).
 * Non-image uploads fall back to a download link.
 */
export const uploadConverter: Partial<JSXConverters<NodeTypes>> = {
  upload: ({ node }) => {
    if (typeof node.value !== 'object' || node.value === null) return null;

    const doc = node.value as unknown as Record<string, unknown>;
    const url = typeof doc.url === 'string' ? doc.url : undefined;
    const mimeType = typeof doc.mimeType === 'string' ? doc.mimeType : '';

    if (url === undefined) return null;

    // Non-image: render a download link
    if (!mimeType.startsWith('image')) {
      const filename = typeof doc.filename === 'string' ? doc.filename : url;
      return (
        <a href={url} rel="noopener noreferrer">
          {filename}
        </a>
      );
    }

    const alt = typeof doc.alt === 'string' ? doc.alt : '';
    const width = typeof doc.width === 'number' ? doc.width : 800;
    const height = typeof doc.height === 'number' ? doc.height : 450;

    return <Figure src={url} alt={alt} width={width} height={height} />;
  },
};
