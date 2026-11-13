import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { write } from '@utils/persistent-store';
import { MOTION_STORAGE_KEY } from '@utils/prefers-reduced-motion';

import { SCRAMBLE_TEXT_TAG, defineScrambleTextElement } from './element';

const { loadGsap } = vi.hoisted(() => ({ loadGsap: vi.fn() }));
vi.mock('@utils/gsap', async () => {
  const actual = await vi.importActual<typeof import('@utils/gsap')>('@utils/gsap');
  loadGsap.mockImplementation(actual.loadGsap);
  return { loadGsap };
});

const original = window.matchMedia.bind(window);

const forceBreakpoint = (mode: 'desktop' | 'mobile') => {
  window.matchMedia = ((query: string) =>
    ({
      // prefers-reduced-motion stays false — the toggle override drives it in tests.
      matches: query.includes('prefers-reduced-motion') ? false : mode === 'mobile' ? query.includes('max-width') : query.includes('min-width'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList) as typeof window.matchMedia;
};

// The markup scramble-text.astro renders (root span: srOnly, ghost, fill).
const markup = (text: string, trigger?: 'group') =>
  `<${SCRAMBLE_TEXT_TAG}${trigger === undefined ? '' : ` trigger="${trigger}"`}><span><span>${text}</span><span aria-hidden="true">${text}</span><span aria-hidden="true">${text}</span></span></${SCRAMBLE_TEXT_TAG}>`;

// `offscreen` parks the subject outside the viewport so the real (Playwright) cursor
// can never fire a trusted pointerenter on it — for negative "no gsap / no decode"
// assertions (the synthetic `hover` below still reaches it).
const mount = (html: string, { offscreen = false }: { offscreen?: boolean } = {}) => {
  const container = document.createElement('div');
  if (offscreen) container.style.cssText = 'position: fixed; top: -1000px; left: -1000px;';
  container.innerHTML = html;
  document.body.appendChild(container);
  return container;
};

const fillOf = (container: HTMLElement) => {
  const fill = container.querySelector(`${SCRAMBLE_TEXT_TAG} > span > span:nth-child(3)`);
  if (!(fill instanceof HTMLElement)) throw new Error('fill not rendered');
  return fill;
};

const flush = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));
// Waits for the (shared, cached) gsap chunk so a bind has settled — the first load in a
// fresh browser can take longer than a fixed delay.
const settle = async () => {
  const actual = await vi.importActual<typeof import('@utils/gsap')>('@utils/gsap');
  await actual.loadGsap('scramble');
  await flush();
};
// Records whether a decode STARTED, instead of sampling the transient
// data-scrambling attribute afterwards: under a loaded full run the settle delay can
// outlast the 0.5s tween, whose onComplete already removed the attribute.
const watchDecode = (fill: HTMLElement) => {
  const state = { started: false };
  const observer = new MutationObserver(() => {
    if (fill.hasAttribute('data-scrambling')) state.started = true;
  });
  observer.observe(fill, { attributes: true, attributeFilter: ['data-scrambling'] });
  return {
    get started() {
      observer.disconnect();
      return state.started;
    },
  };
};

const hover = (target: Element) => target.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));

describe('<scramble-text>', () => {
  beforeEach(() => {
    defineScrambleTextElement();
    write(MOTION_STORAGE_KEY, null);
    forceBreakpoint('desktop');
  });

  afterEach(() => {
    window.matchMedia = original;
    write(MOTION_STORAGE_KEY, null);
    document.body.replaceChildren();
    loadGsap.mockClear();
  });

  it('registers once (re-running the bundled script is a no-op)', () => {
    expect(() => defineScrambleTextElement()).not.toThrow();
    expect(customElements.get(SCRAMBLE_TEXT_TAG)).toBeDefined();
  });

  it('decodes on hover of its own text', async () => {
    const container = mount(markup('archive'));
    await settle();
    const decode = watchDecode(fillOf(container));
    hover(container.querySelector(`${SCRAMBLE_TEXT_TAG} > span`) ?? container);
    await settle();
    expect(decode.started).toBe(true);
  });

  it('decodes on hover of the explicit [data-scramble-host] for trigger="group"', async () => {
    const container = mount(`<a href="/x" data-scramble-host><div>${markup('archive', 'group')}</div></a>`);
    await settle();
    const decode = watchDecode(fillOf(container));
    hover(container.querySelector('[data-scramble-host]') ?? container);
    await settle();
    expect(decode.started).toBe(true);
  });

  it('never imports gsap while reduced motion is on, and binds once it is turned off', async () => {
    write(MOTION_STORAGE_KEY, false);
    const container = mount(markup('archive'), { offscreen: true });
    hover(container.querySelector(`${SCRAMBLE_TEXT_TAG} > span`) ?? container);
    await flush();
    expect(loadGsap).not.toHaveBeenCalled();

    write(MOTION_STORAGE_KEY, true);
    await flush();
    // Bound, but gsap still waits for the first hover.
    expect(loadGsap).not.toHaveBeenCalled();
    const decode = watchDecode(fillOf(container));
    hover(container.querySelector(`${SCRAMBLE_TEXT_TAG} > span`) ?? container);
    await settle();
    expect(loadGsap).toHaveBeenCalledWith('scramble');
    expect(decode.started).toBe(true);
  });

  it('stops decoding when reduced motion is turned on', async () => {
    const container = mount(markup('archive'));
    await settle();
    write(MOTION_STORAGE_KEY, false);
    await settle();
    const decode = watchDecode(fillOf(container));
    hover(container.querySelector(`${SCRAMBLE_TEXT_TAG} > span`) ?? container);
    await settle();
    expect(decode.started).toBe(false);
  });

  // A soft navigation connects the incoming page's elements mid-swap, while the window
  // still holds the previous page's scroll; an in-view trigger bound then would judge
  // against that stale layout. The bind waits for astro:page-load.
  it('defers the bind while a ClientRouter swap is in progress and binds at astro:page-load', async () => {
    document.dispatchEvent(new Event('astro:before-swap'));
    const container = mount(markup('archive'), { offscreen: true });
    const early = watchDecode(fillOf(container));
    hover(container.querySelector(`${SCRAMBLE_TEXT_TAG} > span`) ?? container);
    await settle();
    expect(early.started).toBe(false);

    document.dispatchEvent(new Event('astro:page-load'));
    await flush();
    const decode = watchDecode(fillOf(container));
    hover(container.querySelector(`${SCRAMBLE_TEXT_TAG} > span`) ?? container);
    await settle();
    expect(decode.started).toBe(true);
  });

  // transition:persist / a soft navigation moves the element: the DOM survives the
  // disconnect, so a decode reverted mid-hover must not leave frozen glyphs behind.
  it('heals the resting text when disconnected mid-decode and rebinds on reconnect', async () => {
    const container = mount(markup('archive'));
    await settle();
    const element = container.querySelector(SCRAMBLE_TEXT_TAG);
    if (element === null) throw new Error('not rendered');
    const fill = fillOf(container);
    hover(element.firstElementChild ?? element);
    await flush(150);
    // Deliberately the transient state: the point is to disconnect MID-decode.
    expect(fill.hasAttribute('data-scrambling')).toBe(true);

    element.remove();
    expect(fill.textContent).toBe('archive');

    container.appendChild(element);
    await settle();
    expect(fill.textContent).toBe('archive');
    expect(fill.hasAttribute('data-scrambling')).toBe(false);

    const rebound = watchDecode(fill);
    hover(element.firstElementChild ?? element);
    await settle();
    expect(rebound.started).toBe(true);
  });
});
