import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';

import { youtubeEmbedBlockConverters } from './index';

import type { ReactNode } from 'react';

const ID = 'dQw4w9WgXcQ';
const URL_HTTPS = `https://www.youtube.com/watch?v=${ID}`;

const blockNode = (fields: Record<string, unknown>): Record<string, unknown> => ({
  type: 'block',
  fields: { id: 'x', blockType: 'youtube-embed', ...fields },
  format: '',
  version: 2,
});

const renderYouTube = (fields: Record<string, unknown>): ReactNode => {
  const converter = youtubeEmbedBlockConverters['youtube-embed'];
  if (typeof converter !== 'function') throw new Error('youtube-embed converter must be a function');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- minimal converter-arg stub
  return converter({ node: blockNode(fields), childIndex: 0, converters: {}, nodesToJSX: () => [], parent: {} } as any);
};

describe('youtubeEmbedBlockConverters youtube-embed', () => {
  it('renders one iframe pointing at the youtube-nocookie embed URL', async () => {
    const { container } = await render(<>{renderYouTube({ url: URL_HTTPS })}</>);
    const iframes = container.querySelectorAll('iframe');
    expect(iframes).toHaveLength(1);
    expect(iframes[0]?.getAttribute('src')).toBe(`https://www.youtube-nocookie.com/embed/${ID}`);
  });

  it('accepts the youtu.be short link and normalises to the same embed URL', async () => {
    const { container } = await render(<>{renderYouTube({ url: `https://youtu.be/${ID}` })}</>);
    expect(container.querySelector('iframe')?.getAttribute('src')).toBe(`https://www.youtube-nocookie.com/embed/${ID}`);
  });

  it('lazy-loads the iframe', async () => {
    const { container } = await render(<>{renderYouTube({ url: URL_HTTPS })}</>);
    expect(container.querySelector('iframe')?.getAttribute('loading')).toBe('lazy');
  });

  it('uses the caption as the iframe title and figcaption when provided', async () => {
    const { container } = await render(<>{renderYouTube({ url: URL_HTTPS, caption: 'Never gonna give you up' })}</>);
    expect(container.querySelector('iframe')?.getAttribute('title')).toBe('Never gonna give you up');
    expect(container.querySelector('figcaption')?.textContent).toBe('Never gonna give you up');
  });

  it('falls back to a generic Japanese title when no caption is present, and omits the figcaption', async () => {
    const { container } = await render(<>{renderYouTube({ url: URL_HTTPS })}</>);
    expect(container.querySelector('iframe')?.getAttribute('title')).toBe('YouTube 動画');
    expect(container.querySelector('figcaption')).toBeNull();
  });

  it('renders nothing when the URL cannot be parsed as a YouTube URL', async () => {
    const { container } = await render(<>{renderYouTube({ url: 'https://vimeo.com/1234' })}</>);
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('renders nothing when the URL field is missing', async () => {
    const { container } = await render(<>{renderYouTube({})}</>);
    expect(container.querySelector('iframe')).toBeNull();
  });
});
