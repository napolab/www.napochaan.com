import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { BLUR_ATTRIBUTE, imageBlurScriptHtml } from './blur-script';
import { Image } from './index';

const BLUR = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// SSR-only Image: the markup Astro emits for a React component without `client:*`.
// No React runs in the browser, so only the global script can clear the blur.
const insertServerMarkup = (alt: string): HTMLImageElement => {
  const container = document.createElement('div');
  container.innerHTML = renderToString(<Image src={PIXEL} alt={alt} width={1} height={1} placeholder="blur" blurDataURL={BLUR} />);
  document.body.appendChild(container);
  const img = container.querySelector('img');
  if (img === null) throw new Error('img not rendered');

  return img;
};

const runBlurScript = () => {
  const script = document.createElement('script');
  script.textContent = imageBlurScriptHtml.__html;
  document.head.appendChild(script);
};

const waitForComplete = (img: HTMLImageElement) => expect.poll(() => img.complete && img.naturalWidth > 0).toBe(true);

describe('imageBlurScriptHtml (SSR-only Image, no hydration)', () => {
  it('server markup carries the blur background and the data attribute', () => {
    const img = insertServerMarkup('ssr markup');
    expect(img.hasAttribute(BLUR_ATTRIBUTE)).toBe(true);
    expect(img.style.backgroundImage).toBe(`url("${BLUR}")`);
  });

  it('clears an image that completed before the script ran', async () => {
    const img = insertServerMarkup('already complete');
    await waitForComplete(img);
    expect(img.style.backgroundImage).toBe(`url("${BLUR}")`);

    runBlurScript();

    expect(img.style.backgroundImage).toBe('');
    expect(img.hasAttribute(BLUR_ATTRIBUTE)).toBe(false);
  });

  it('clears an image when it loads after the script is installed', async () => {
    const img = insertServerMarkup('loads later');

    await expect.poll(() => img.style.backgroundImage).toBe('');
    expect(img.hasAttribute(BLUR_ATTRIBUTE)).toBe(false);
  });

  it('clears complete images again on astro:page-load (ClientRouter swap)', async () => {
    const img = insertServerMarkup('page load');
    await expect.poll(() => img.style.backgroundImage).toBe('');
    // Simulate a swapped-in, already-complete image the load listener missed.
    img.style.backgroundImage = `url("${BLUR}")`;
    img.setAttribute(BLUR_ATTRIBUTE, '');

    document.dispatchEvent(new Event('astro:page-load'));

    expect(img.style.backgroundImage).toBe('');
  });

  it('leaves a failed image blurred (nothing better to show)', async () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Image src="/does-not-exist.png" alt="broken" width={1} height={1} placeholder="blur" blurDataURL={BLUR} unoptimized />);
    document.body.appendChild(container);
    const img = container.querySelector('img');
    if (img === null) throw new Error('img not rendered');
    await expect.poll(() => img.complete).toBe(true);

    document.dispatchEvent(new Event('astro:page-load'));

    expect(img.style.backgroundImage).toBe(`url("${BLUR}")`);
  });

  it('coexists with a hydrated Image (script and React both clear, no blur left)', async () => {
    const element = <Image src={PIXEL} alt="hydrated with script" width={1} height={1} placeholder="blur" blurDataURL={BLUR} />;
    const container = document.createElement('div');
    container.innerHTML = renderToString(element);
    document.body.appendChild(container);
    const img = container.querySelector('img');
    if (img === null) throw new Error('img not rendered');

    const root = hydrateRoot(container, element);

    await expect.poll(() => img.style.backgroundImage).toBe('');
    await expect.poll(() => img.hasAttribute(BLUR_ATTRIBUTE)).toBe(false);
    root.unmount();
  });
});
