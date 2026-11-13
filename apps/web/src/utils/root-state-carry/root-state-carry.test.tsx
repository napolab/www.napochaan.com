import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { rootStateCarryScriptHTML } from './index';

// The script runs from an inline <script> in <head>; inject it the same way.
const install = (): void => {
  const script = document.createElement('script');
  script.textContent = rootStateCarryScriptHTML.__html;
  document.head.appendChild(script);
  script.remove();
};

// What ClientRouter fetches: the cacheable SSR document, still in its boot state.
const incoming = (): Document => new DOMParser().parseFromString('<html lang="ja" class="font-variables wf-loading boot"><head></head><body></body></html>', 'text/html');

// Astro dispatches a TransitionBeforeSwapEvent carrying `newDocument`.
const beforeSwap = (newDocument: Document): void => {
  const event = Object.assign(new Event('astro:before-swap'), { newDocument });
  document.dispatchEvent(event);
};

const root = document.documentElement;
const initialClass = root.className;
const initialStyle = root.getAttribute('style');

beforeAll(() => {
  install();
  // A second copy (e.g. a re-executed head) must not register a second listener.
  install();
});

afterEach(() => {
  root.className = initialClass;
  if (initialStyle === null) root.removeAttribute('style');
  else root.setAttribute('style', initialStyle);
  for (const el of document.head.querySelectorAll('[data-test-typekit]')) el.remove();
});

describe('rootStateCarryScriptHTML', () => {
  it('keeps the live <html> class so a soft navigation does not bring back boot / wf-loading', () => {
    root.className = 'font-variables wf-active';
    const doc = incoming();

    beforeSwap(doc);

    expect(doc.documentElement.className).toBe('font-variables wf-active');
  });

  it('is a no-op for the boot overlay once boot was already removed', () => {
    root.className = 'font-variables wf-inactive';
    const doc = incoming();

    beforeSwap(doc);

    expect(doc.documentElement.classList.contains('boot')).toBe(false);
    expect(doc.documentElement.classList.contains('wf-loading')).toBe(false);
  });

  it('carries the inline style (--motion-play, --scroll-range) onto the incoming root', () => {
    root.setAttribute('style', '--motion-play: paused; --scroll-range: 120px;');
    const doc = incoming();

    beforeSwap(doc);

    expect(doc.documentElement.style.getPropertyValue('--motion-play').trim()).toBe('paused');
    expect(doc.documentElement.style.getPropertyValue('--scroll-range').trim()).toBe('120px');
  });

  it('carries head nodes injected by the Typekit kit so the fonts survive swapHeadElements', () => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://p.typekit.net/p.css?s=1';
    link.setAttribute('data-test-typekit', '');
    document.head.appendChild(link);
    const doc = incoming();

    beforeSwap(doc);

    expect(doc.head.querySelectorAll('link[href="https://p.typekit.net/p.css?s=1"]')).toHaveLength(1);
  });
});
