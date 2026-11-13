import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

import { Image } from './index';

const BLUR = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';

// 1x1 transparent GIF so `load` fires without a network round trip.
const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const optimizedURL = (src: string, width: number, quality: number) => `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;

describe('Image', () => {
  it('renders an <img> with src, alt and size', async () => {
    await render(<Image src="/test.jpg" alt="Test image" width={100} height={100} />);

    const image = page.getByRole('img', { name: 'Test image' });
    await expect.element(image).toHaveAttribute('src', optimizedURL('/test.jpg', 2048, 75));
    await expect.element(image).toHaveAttribute('width', '100');
    await expect.element(image).toHaveAttribute('height', '100');
  });

  it('builds a srcset over the device widths through the worker images path (quality 75 default)', async () => {
    await render(<Image src="/media/a b.jpg" alt="srcset" width={100} height={100} />);

    const srcset = page.getByRole('img', { name: 'srcset' }).element().getAttribute('srcset') ?? '';
    const expected = [640, 750, 828, 1080, 1200, 1920, 2048].map((w) => `${optimizedURL('/media/a b.jpg', w, 75)} ${w}w`).join(', ');
    expect(srcset).toBe(expected);
  });

  it('honours an explicit quality and passes sizes through', async () => {
    await render(<Image src="/test.jpg" alt="quality" width={100} height={100} quality={40} sizes="50vw" />);

    const image = page.getByRole('img', { name: 'quality' });
    await expect.element(image).toHaveAttribute('sizes', '50vw');
    expect(image.element().getAttribute('srcset')).toContain(`${optimizedURL('/test.jpg', 640, 40)} 640w`);
  });

  it('defaults to lazy loading and switches to eager with priority', async () => {
    await render(
      <>
        <Image src="/a.jpg" alt="lazy" width={10} height={10} />
        <Image src="/b.jpg" alt="eager" width={10} height={10} priority />
      </>,
    );

    await expect.element(page.getByRole('img', { name: 'lazy' })).toHaveAttribute('loading', 'lazy');
    await expect.element(page.getByRole('img', { name: 'eager' })).toHaveAttribute('loading', 'eager');
    await expect.element(page.getByRole('img', { name: 'eager' })).toHaveAttribute('fetchpriority', 'high');
  });

  it('shows the blur placeholder as a background until the image loads', async () => {
    // A src that never resolves keeps the image in its loading state.
    await render(<Image src="/never-loads.jpg" alt="blurred" width={100} height={100} placeholder="blur" blurDataURL={BLUR} />);

    const image = page.getByRole('img', { name: 'blurred' });
    await expect.element(image).toHaveStyle({ backgroundImage: `url("${BLUR}")` });
  });

  it('removes the blur placeholder after load', async () => {
    await render(<Image src={PIXEL} alt="loaded" width={1} height={1} placeholder="blur" blurDataURL={BLUR} unoptimized />);

    const image = page.getByRole('img', { name: 'loaded' });
    await expect.poll(() => image.element().style.backgroundImage).toBe('');
  });

  it('does not set a background without a blur placeholder', async () => {
    await render(<Image src="/test.jpg" alt="plain" width={100} height={100} placeholder="empty" />);

    expect(page.getByRole('img', { name: 'plain' }).element().style.backgroundImage).toBe('');
  });
});
