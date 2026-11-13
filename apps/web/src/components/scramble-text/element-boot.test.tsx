import { afterEach, describe, expect, it } from 'vitest';

import { SCRAMBLE_TEXT_TAG, defineScrambleTextElement } from './element';

// Own file: the shared defaultBootStore latches READY on its first subscribe, so this
// must run before any other <scramble-text> in the same browser context subscribes.

const original = window.matchMedia.bind(window);

const forceMobile = () => {
  window.matchMedia = ((query: string) =>
    ({
      matches: query.includes('max-width'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList) as typeof window.matchMedia;
};

const flush = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));

describe('<scramble-text> boot gating', () => {
  afterEach(() => {
    window.matchMedia = original;
    document.documentElement.classList.remove('boot');
    document.body.replaceChildren();
  });

  it('holds the mobile in-view decode while the boot overlay is up and decodes once it lifts', async () => {
    document.documentElement.classList.add('boot');
    forceMobile();
    defineScrambleTextElement();
    const container = document.createElement('div');
    container.innerHTML = `<${SCRAMBLE_TEXT_TAG}><span><span>archive</span><span aria-hidden="true">archive</span><span aria-hidden="true">archive</span></span></${SCRAMBLE_TEXT_TAG}>`;
    document.body.appendChild(container);
    const fill = container.querySelector(`${SCRAMBLE_TEXT_TAG} > span > span:nth-child(3)`);
    if (fill === null) throw new Error('fill not rendered');

    const { loadGsap } = await import('@utils/gsap');
    await loadGsap('scramble');
    await flush();
    expect(fill.hasAttribute('data-scrambling')).toBe(false);

    document.documentElement.classList.remove('boot');
    await expect.poll(() => fill.hasAttribute('data-scrambling')).toBe(true);
  });
});
