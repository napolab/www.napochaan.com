import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';

import { imageRowBlockConverters } from './index';

import type { ReactNode } from 'react';

// A populated media object as Payload returns it inside a block upload field.
const media = (filename: string, alt: string): Record<string, unknown> => ({
  id: 1,
  alt,
  url: `/api/media/file/${filename}`,
  filename,
  mimeType: 'image/png',
  width: 800,
  height: 450,
});

const cell = (filename: string, alt: string, caption?: string): unknown => ({
  image: media(filename, alt),
  caption,
});

// Build the block node the converter receives. `cells` lives under node.fields.
const blockNode = (cells: readonly unknown[]): Record<string, unknown> => ({
  type: 'block',
  fields: { id: 'x', blockType: 'image-row', cells },
  format: '',
  version: 2,
});

const renderImageRow = (cells: readonly unknown[]): ReactNode => {
  const converter = imageRowBlockConverters['image-row'];
  if (typeof converter !== 'function') throw new Error('image-row converter must be a function');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- minimal converter-arg stub
  return converter({ node: blockNode(cells), childIndex: 0, converters: {}, nodesToJSX: () => [], parent: {} } as any);
};

describe('imageRowBlockConverters image-row', () => {
  it('renders one Figure image per cell', async () => {
    const { container } = await render(<>{renderImageRow([cell('a.png', 'alt a'), cell('b.png', 'alt b')])}</>);

    expect(container.querySelectorAll('img')).toHaveLength(2);
  });

  it('renders the explicit caption when provided', async () => {
    const { container } = await render(<>{renderImageRow([cell('a.png', 'alt a', 'left tag'), cell('b.png', 'alt b', 'right tag')])}</>);

    expect(container.textContent).toContain('left tag');
    expect(container.textContent).toContain('right tag');
  });

  it('falls back to the media alt when no caption is given', async () => {
    const { container } = await render(<>{renderImageRow([cell('a.png', 'fallback alt'), cell('b.png', 'alt b')])}</>);

    expect(container.textContent).toContain('fallback alt');
  });

  it('skips a cell whose image is not populated (numeric id / missing)', async () => {
    const unpopulated = { image: 7, caption: 'no media' };
    const { container } = await render(<>{renderImageRow([cell('a.png', 'alt a'), unpopulated])}</>);

    expect(container.querySelectorAll('img')).toHaveLength(1);
  });

  it('renders nothing when cells is not an array', async () => {
    const converter = imageRowBlockConverters['image-row'];
    if (typeof converter !== 'function') throw new Error('image-row converter must be a function');
    const node = { type: 'block', fields: { id: 'x', blockType: 'image-row', cells: undefined }, format: '', version: 2 };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- minimal converter-arg stub
    const { container } = await render(<>{converter({ node, childIndex: 0, converters: {}, nodesToJSX: () => [], parent: {} } as any)}</>);

    expect(container.querySelectorAll('img')).toHaveLength(0);
  });
});
