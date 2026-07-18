import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';

import { uploadConverter } from './index';

import type { ReactNode } from 'react';

// Minimal upload-node fixture. `value` is the populated media doc; `fields` is
// the node's own field bag (only `caption` matters for this converter).
const uploadNode = (value: Record<string, unknown>, fields: Record<string, unknown> = {}): Record<string, unknown> => ({
  type: 'upload',
  relationTo: 'media',
  value,
  fields,
  format: '',
  version: 1,
});

const renderUpload = (value: Record<string, unknown>, fields: Record<string, unknown> = {}): ReactNode => {
  const converter = uploadConverter.upload;
  if (typeof converter !== 'function') throw new Error('upload converter must be a function');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- minimal converter-arg stub, mirrors image-row.test.tsx
  return converter({ node: uploadNode(value, fields), childIndex: 0, converters: {}, nodesToJSX: () => [], parent: {} } as any);
};

describe('uploadConverter upload — video/*', () => {
  it('renders a standalone video upload as a controlled player with no caption', async () => {
    const { container } = await render(<>{renderUpload({ id: 1, url: '/api/media/file/clip.mp4', mimeType: 'video/mp4', width: 1920, height: 1080 })}</>);

    const el = container.querySelector('video[data-variant="player"]') as HTMLVideoElement;
    expect(el).not.toBeNull();
    expect(el.getAttribute('src')).toBe('/api/media/file/clip.mp4');
    expect(container.querySelector('figcaption')).toBeNull();
  });

  it('falls back to 800x450 when width/height are missing', async () => {
    const { container } = await render(<>{renderUpload({ id: 1, url: '/api/media/file/clip.mp4', mimeType: 'video/mp4' })}</>);

    const el = container.querySelector('video[data-variant="player"]') as HTMLVideoElement;
    expect(el.style.getPropertyValue('--video-aspect-ratio')).toBe('800 / 450');
  });

  it('still falls back to a download link for a non-image, non-video upload', async () => {
    const { container } = await render(<>{renderUpload({ id: 1, url: '/api/media/file/doc.pdf', mimeType: 'application/pdf', filename: 'doc.pdf' })}</>);

    expect(container.querySelector('video')).toBeNull();
    expect(container.querySelector('a')?.getAttribute('href')).toBe('/api/media/file/doc.pdf');
  });

  it('still renders an image upload as a Figure', async () => {
    const { container } = await render(<>{renderUpload({ id: 1, url: '/api/media/file/pic.png', mimeType: 'image/png', width: 800, height: 450, alt: 'a picture' })}</>);

    expect(container.querySelector('video')).toBeNull();
    expect(container.querySelector('img')).not.toBeNull();
  });
});
