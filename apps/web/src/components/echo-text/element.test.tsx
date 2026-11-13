import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { write } from '@utils/persistent-store';
import { MOTION_STORAGE_KEY } from '@utils/prefers-reduced-motion';

import { ECHO_TEXT_TAG, defineEchoTextElement } from './element';

const { loadGsap } = vi.hoisted(() => ({ loadGsap: vi.fn() }));
vi.mock('@utils/gsap', async () => {
  const actual = await vi.importActual<typeof import('@utils/gsap')>('@utils/gsap');
  loadGsap.mockImplementation(actual.loadGsap);
  return { loadGsap };
});

// The markup echo-text.astro renders (root span: echoOut, echoBlue, fill → [scramble, red dot]).
const markup = (text: string) =>
  `<${ECHO_TEXT_TAG}><span role="img" aria-label="${text}"><span aria-hidden="true">${text}</span><span aria-hidden="true">${text}</span><span aria-hidden="true"><span data-scramble="true">${text}</span><span>.</span></span></span></${ECHO_TEXT_TAG}>`;

const mount = (html: string) => {
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);
  return container;
};

const scrambleOf = (container: HTMLElement) => {
  const scramble = container.querySelector('[data-scramble]');
  if (!(scramble instanceof HTMLElement)) throw new Error('scramble span not rendered');
  return scramble;
};

const flush = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));
const settle = async () => {
  const actual = await vi.importActual<typeof import('@utils/gsap')>('@utils/gsap');
  await actual.loadGsap('scramble');
  await flush();
};

describe('<echo-text>', () => {
  beforeEach(() => {
    defineEchoTextElement();
    write(MOTION_STORAGE_KEY, null);
  });

  afterEach(() => {
    write(MOTION_STORAGE_KEY, null);
    document.body.replaceChildren();
    loadGsap.mockClear();
  });

  it('registers once (re-running the bundled script is a no-op)', () => {
    expect(() => defineEchoTextElement()).not.toThrow();
    expect(customElements.get(ECHO_TEXT_TAG)).toBeDefined();
  });

  it('decodes on connect with the box pinned, then settles on the wordmark and releases it', async () => {
    const container = mount(markup('napochaan'));
    const scramble = scrambleOf(container);

    await expect.poll(() => scramble.style.width, { timeout: 3000 }).toMatch(/px$/);
    await expect.poll(() => scramble.style.width, { timeout: 6000 }).toBe('');
    expect(scramble.textContent).toBe('napochaan');
  });

  it('re-decodes on pointerenter of the wordmark', async () => {
    const container = mount(markup('napochaan'));
    const scramble = scrambleOf(container);
    await expect.poll(() => scramble.style.width, { timeout: 6000 }).toMatch(/px$/);
    await expect.poll(() => scramble.style.width, { timeout: 6000 }).toBe('');

    container.querySelector('[role="img"]')?.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'touch' }));
    await expect.poll(() => scramble.style.width, { timeout: 3000 }).toMatch(/px$/);
  });

  it('never imports gsap while reduced motion is on, and binds once it is turned off', async () => {
    write(MOTION_STORAGE_KEY, false);
    const container = mount(markup('napochaan'));
    container.querySelector('[role="img"]')?.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
    await settle();
    expect(loadGsap).not.toHaveBeenCalled();

    write(MOTION_STORAGE_KEY, true);
    await settle();
    expect(loadGsap).toHaveBeenCalled();
  });

  // The DOM outlives the teardown: a decode reverted mid-scramble must not leave
  // glyphs or the pinned box behind.
  it('heals the wordmark when reduced motion is turned on mid-decode', async () => {
    const container = mount(markup('napochaan'));
    const scramble = scrambleOf(container);
    await expect.poll(() => scramble.style.width, { timeout: 3000 }).toMatch(/px$/);

    write(MOTION_STORAGE_KEY, false);
    expect(scramble.textContent).toBe('napochaan');
    expect(scramble.style.width).toBe('');
    expect(scramble.style.display).toBe('');
  });

  it('defers the bind while a ClientRouter swap is in progress and binds at astro:page-load', async () => {
    document.dispatchEvent(new Event('astro:before-swap'));
    mount(markup('napochaan'));
    await settle();
    expect(loadGsap).not.toHaveBeenCalled();

    document.dispatchEvent(new Event('astro:page-load'));
    await settle();
    expect(loadGsap).toHaveBeenCalled();
  });
});
