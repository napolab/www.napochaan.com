import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { Video } from './index';
import * as styles from './styles.css';

describe('Video', () => {
  it('renders an ambient video with no controls, autoplay, muted and loop', async () => {
    const { container } = await render(<Video src="/clip.mp4" variant="ambient" width={640} height={360} />);

    const el = container.querySelector('video');
    expect(el).not.toBeNull();
    expect(el?.hasAttribute('controls')).toBe(false);
    // jsdom/chromium mount here is a client-only render (no real SSR pass), so
    // React sets these as DOM *properties*, not necessarily HTML attributes —
    // see ssr-muted.test.ts for proof the attribute lands in real SSR output.
    expect((el as HTMLVideoElement).muted).toBe(true);
    expect((el as HTMLVideoElement).loop).toBe(true);
    expect((el as HTMLVideoElement).autoplay).toBe(true);
  });

  it('renders a player video with controls, preload=metadata and no autoplay/muted', async () => {
    const { container } = await render(<Video src="/clip.mp4" variant="player" width={640} height={360} />);

    const el = container.querySelector('video') as HTMLVideoElement;
    expect(el.hasAttribute('controls')).toBe(true);
    expect(el.getAttribute('preload')).toBe('metadata');
    expect(el.autoplay).toBe(false);
    expect(el.loop).toBe(false);
  });

  it('sets the poster attribute on the player variant when posterSrc is given', async () => {
    const { container } = await render(<Video src="/clip.mp4" variant="player" width={640} height={360} posterSrc="/poster.jpg" />);

    const el = container.querySelector('video') as HTMLVideoElement;
    expect(el.getAttribute('poster')).toBe('/poster.jpg');
  });

  it('omits the poster attribute when posterSrc is not given', async () => {
    const { container } = await render(<Video src="/clip.mp4" variant="player" width={640} height={360} />);

    const el = container.querySelector('video') as HTMLVideoElement;
    expect(el.hasAttribute('poster')).toBe(false);
  });

  it('reserves the box footprint via the --video-aspect-ratio custom property', async () => {
    const { container } = await render(<Video src="/clip.mp4" variant="ambient" width={640} height={360} />);

    const el = container.querySelector('video') as HTMLVideoElement;
    expect(el.style.getPropertyValue('--video-aspect-ratio')).toBe('640 / 360');
  });

  it('always wraps the video in a figure, with no figcaption when caption is omitted', async () => {
    const { container } = await render(<Video src="/clip.mp4" variant="ambient" width={640} height={360} />);

    expect(container.querySelector('figure')).not.toBeNull();
    expect(container.querySelector('figcaption')).toBeNull();
  });

  it('wraps the video in a figure/figcaption when a caption is given', async () => {
    render(<Video src="/clip.mp4" variant="player" width={640} height={360} caption="VJ loop / 2026" />);

    await expect.element(page.getByText('VJ loop / 2026')).toBeInTheDocument();
  });

  it('marks the ambient video as aria-hidden (decorative), unlike the player variant', async () => {
    const { container } = await render(
      <>
        <Video src="/clip.mp4" variant="ambient" width={640} height={360} />
        <Video src="/clip.mp4" variant="player" width={640} height={360} />
      </>,
    );

    const ambient = container.querySelector('video[data-variant="ambient"]');
    const player = container.querySelector('video[data-variant="player"]');
    expect(ambient?.getAttribute('aria-hidden')).toBe('true');
    expect(player?.hasAttribute('aria-hidden')).toBe(false);
  });

  it('sets the poster attribute on the ambient video when posterSrc is given', async () => {
    const { container } = await render(<Video src="/clip.mp4" variant="ambient" width={640} height={360} posterSrc="/poster.jpg" />);

    const el = container.querySelector('video[data-variant="ambient"]') as HTMLVideoElement;
    expect(el.getAttribute('poster')).toBe('/poster.jpg');
  });

  it('renders a reduced-motion fallback img for the ambient variant when posterSrc is given', async () => {
    const { container } = await render(<Video src="/clip.mp4" variant="ambient" width={640} height={360} posterSrc="/poster.jpg" />);

    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('/poster.jpg');
    expect(img?.getAttribute('alt')).toBe('');
    expect(img?.getAttribute('aria-hidden')).toBe('true');
    expect(img?.getAttribute('width')).toBe('640');
    expect(img?.getAttribute('height')).toBe('360');
    expect(img?.className).toBe(styles.ambientFallback);
  });

  it('renders no fallback img for the ambient variant when posterSrc is not given', async () => {
    const { container } = await render(<Video src="/clip.mp4" variant="ambient" width={640} height={360} />);

    expect(container.querySelector('img')).toBeNull();
  });

  it('renders no fallback img for the player variant even when posterSrc is given', async () => {
    const { container } = await render(<Video src="/clip.mp4" variant="player" width={640} height={360} posterSrc="/poster.jpg" />);

    expect(container.querySelector('img')).toBeNull();
  });
});
