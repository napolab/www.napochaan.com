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

  it('makes each cell a zoomable lightbox trigger labelled by its alt', async () => {
    const { container } = await render(<>{renderImageRow([cell('a.png', 'alt a'), cell('b.png', 'alt b')])}</>);

    const triggers = container.querySelectorAll('button[aria-label="alt a"], button[aria-label="alt b"]');
    expect(triggers).toHaveLength(2);
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

  // The row is 85% of the content column (1180 * 0.85 / 2 ≈ 500 per cell above
  // the container-query breakpoint), and the 480px `sizes` breakpoint used to be
  // a raw px value even though the row's own two-column layout is a CONTAINER
  // query firing at ~565px viewport (see styles.css.ts), not a 480px one.
  it('passes a sizes attribute derived from the content column and the container breakpoint', async () => {
    const { container } = await render(<>{renderImageRow([cell('a.png', 'alt a'), cell('b.png', 'alt b')])}</>);

    const images = container.querySelectorAll('[data-testid="next-image"]');
    expect(images).toHaveLength(2);
    for (const img of images) {
      expect(img.getAttribute('data-sizes')).toBe('(min-width: 1388px) 500px, (min-width: 565px) 42vw, 66vw');
    }
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
