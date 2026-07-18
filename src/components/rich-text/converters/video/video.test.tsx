import { render } from 'vitest-browser-react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { videoBlockConverters } from './index';

import type { ReactNode } from 'react';

// The browser (chromium/playwright) vitest project has no `process` global at
// all — unlike the node ('unit') project, where Vite reserves `BASE_URL` and
// `vi.stubEnv` patches a real `process.env`. The converter itself only ever
// runs server-side in production (RSC), so this is purely a test-harness gap:
// stub a minimal `process.env` for the duration of this suite.
beforeEach(() => {
  vi.stubGlobal('process', { env: { BASE_URL: 'https://napochaan.com', MEDIA_TRANSFORMS: '1' } });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const media = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: 1,
  url: '/api/media/file/clip.mp4',
  mimeType: 'video/mp4',
  width: 1920,
  height: 1080,
  ...overrides,
});

const blockNode = (fields: Record<string, unknown>): Record<string, unknown> => ({
  type: 'block',
  fields: { id: 'x', blockType: 'video', ...fields },
  format: '',
  version: 2,
});

const renderVideoBlock = (fields: Record<string, unknown>): ReactNode => {
  const converter = videoBlockConverters.video;
  if (typeof converter !== 'function') throw new Error('video converter must be a function');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- minimal converter-arg stub, mirrors image-row.test.tsx
  return converter({ node: blockNode(fields), childIndex: 0, converters: {}, nodesToJSX: () => [], parent: {} } as any);
};

describe('videoBlockConverters video', () => {
  it('renders an ambient video routed through the Media Transformations mode=video URL when eligible', async () => {
    const { container } = await render(<>{renderVideoBlock({ video: media({ duration: 10, filesize: 1024 }), variant: 'ambient' })}</>);

    const el = container.querySelector('video[data-variant="ambient"]');
    expect(el).not.toBeNull();
    expect(el?.getAttribute('src')).toBe('https://napochaan.com/cdn-cgi/media/mode=video,audio=false/https://napochaan.com/api/media/file/clip.mp4');
  });

  it('auto-generates a poster for an ambient video within the transform input envelope', async () => {
    const { container } = await render(<>{renderVideoBlock({ video: media({ duration: 10, filesize: 1024 }), variant: 'ambient' })}</>);

    const el = container.querySelector('video[data-variant="ambient"]') as HTMLVideoElement;
    expect(el.getAttribute('poster')).toBe('https://napochaan.com/cdn-cgi/media/mode=frame,time=1s/https://napochaan.com/api/media/file/clip.mp4');
  });

  it('renders no poster for an ambient video when transforms are disabled', async () => {
    vi.stubGlobal('process', { env: { BASE_URL: 'https://napochaan.com', MEDIA_TRANSFORMS: '0' } });

    const { container } = await render(<>{renderVideoBlock({ video: media({ duration: 10, filesize: 1024 }), variant: 'ambient' })}</>);

    const el = container.querySelector('video[data-variant="ambient"]') as HTMLVideoElement;
    expect(el.hasAttribute('poster')).toBe(false);
  });

  it('renders a player video with the raw source and an explicit poster', async () => {
    const { container } = await render(<>{renderVideoBlock({ video: media(), variant: 'player', poster: media({ id: 2, url: '/api/media/file/poster.jpg', mimeType: 'image/jpeg' }) })}</>);

    const el = container.querySelector('video[data-variant="player"]') as HTMLVideoElement;
    expect(el.getAttribute('src')).toBe('/api/media/file/clip.mp4');
    expect(el.getAttribute('poster')).toBe('/api/media/file/poster.jpg');
  });

  it('auto-generates a poster for a player video within the transform input envelope when no explicit poster is set', async () => {
    const { container } = await render(<>{renderVideoBlock({ video: media({ duration: 120, filesize: 1024 }), variant: 'player' })}</>);

    const el = container.querySelector('video[data-variant="player"]') as HTMLVideoElement;
    expect(el.getAttribute('poster')).toBe('https://napochaan.com/cdn-cgi/media/mode=frame,time=1s/https://napochaan.com/api/media/file/clip.mp4');
  });

  it('renders a player video with no poster when auto-generation is ineligible and no explicit poster is set', async () => {
    const { container } = await render(<>{renderVideoBlock({ video: media({ duration: 700, filesize: 1024 }), variant: 'player' })}</>);

    const el = container.querySelector('video[data-variant="player"]') as HTMLVideoElement;
    expect(el.hasAttribute('poster')).toBe(false);
  });

  it('passes the caption through to the Video figure/figcaption', async () => {
    const { container } = await render(<>{renderVideoBlock({ video: media(), variant: 'player', caption: 'VJ loop / 2026' })}</>);

    expect(container.textContent).toContain('VJ loop / 2026');
  });

  it('renders nothing when the video field is not a populated media doc', async () => {
    const { container } = await render(<>{renderVideoBlock({ video: 7, variant: 'ambient' })}</>);

    expect(container.querySelectorAll('video')).toHaveLength(0);
  });
});
