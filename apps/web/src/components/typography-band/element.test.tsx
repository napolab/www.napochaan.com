import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { write } from '@utils/persistent-store';
import { MOTION_STORAGE_KEY } from '@utils/prefers-reduced-motion';

import { TYPOGRAPHY_BAND_TAG, defineTypographyBandElement } from './element';

const { loadGsap } = vi.hoisted(() => ({ loadGsap: vi.fn() }));
vi.mock('@utils/gsap', async () => {
  const actual = await vi.importActual<typeof import('@utils/gsap')>('@utils/gsap');
  loadGsap.mockImplementation(actual.loadGsap);
  return { loadGsap };
});

// The markup typography-band.astro renders: four bands, each holding one track.
const band = '<div aria-hidden="true"><div><span>NAPOCHAAN · </span><span>NAPOCHAAN · </span></div></div>';
const markup = `<${TYPOGRAPHY_BAND_TAG}>${band.repeat(4)}</${TYPOGRAPHY_BAND_TAG}>`;

const mount = () => {
  const container = document.createElement('div');
  container.innerHTML = markup;
  document.body.appendChild(container);
  const element = container.querySelector(TYPOGRAPHY_BAND_TAG);
  if (element === null) throw new Error('not rendered');
  return { container, element };
};

const flush = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));
const realGsap = async () => {
  const actual = await vi.importActual<typeof import('@utils/gsap')>('@utils/gsap');
  return actual.loadGsap('scroll');
};
const settle = async () => {
  await realGsap();
  await flush();
};
// The band's own ticker registrations (gsap adds internal listeners too, but none
// while the band is idle, and its add() calls remove() internally — so leaks are
// checked by whether the drift is still moving, not by counting remove calls).
const spyTickerAdd = async () => {
  const { gsap } = await realGsap();
  return vi.spyOn(gsap.ticker, 'add');
};

const firstTrack = (element: Element) => {
  const track = element.querySelector('div > div');
  if (!(track instanceof HTMLElement)) throw new Error('track not rendered');
  return track;
};

// Whether the drift ticker is still moving the track.
const isDrifting = async (track: HTMLElement) => {
  const before = track.style.transform;
  await flush(150);
  return track.style.transform !== before;
};

describe('<typography-band>', () => {
  beforeEach(() => {
    defineTypographyBandElement();
    write(MOTION_STORAGE_KEY, null);
  });

  afterEach(() => {
    write(MOTION_STORAGE_KEY, null);
    document.body.replaceChildren();
    vi.restoreAllMocks();
    loadGsap.mockClear();
  });

  it('registers once (re-running the bundled script is a no-op)', () => {
    expect(() => defineTypographyBandElement()).not.toThrow();
    expect(customElements.get(TYPOGRAPHY_BAND_TAG)).toBeDefined();
  });

  it('drifts the tracks once gsap has loaded', async () => {
    const { element } = mount();
    const track = firstTrack(element);

    await expect.poll(() => track.style.transform, { timeout: 3000 }).toMatch(/translate/);
  });

  // The page-level bug this element fixes: the React island's first (hydration) effect
  // saw the server snapshot reduced=false and fetched gsap on every page.
  it('never imports gsap while reduced motion is on, and starts once it is turned off', async () => {
    write(MOTION_STORAGE_KEY, false);
    mount();
    await settle();
    expect(loadGsap).not.toHaveBeenCalled();

    write(MOTION_STORAGE_KEY, true);
    await settle();
    expect(loadGsap).toHaveBeenCalled();
  });

  it('stops the drift when reduced motion is turned on', async () => {
    const { element } = mount();
    await settle();
    expect(await isDrifting(firstTrack(element))).toBe(true);

    write(MOTION_STORAGE_KEY, false);
    expect(await isDrifting(firstTrack(element))).toBe(false);
  });

  // transition:persist moves the element (to <html>, then into the new body): each
  // move is a synchronous disconnect + connect. The band must keep drifting from where
  // it was — no teardown, no second ticker.
  it('survives a synchronous persist move without rebinding or leaking a ticker', async () => {
    const add = await spyTickerAdd();
    const { container, element } = mount();
    await settle();
    expect(add).toHaveBeenCalledTimes(1);
    await flush(150);
    const offset = firstTrack(element).style.transform;

    document.documentElement.appendChild(element);
    container.appendChild(element);
    await settle();

    expect(add).toHaveBeenCalledTimes(1);
    expect(loadGsap).toHaveBeenCalledTimes(1);
    // Continuous: still drifting, and not reset back to the origin.
    expect(await isDrifting(firstTrack(element))).toBe(true);
    expect(firstTrack(element).style.transform).not.toBe(offset);
    expect(firstTrack(element).style.transform).not.toMatch(/translate\(0px, 0px\)|translate3d\(0px, 0px/);
  });

  it('removes its ticker when it is really removed', async () => {
    const { element } = mount();
    await settle();
    expect(await isDrifting(firstTrack(element))).toBe(true);

    element.remove();
    await flush();
    expect(await isDrifting(firstTrack(element))).toBe(false);
  });

  // The swap briefly connects the incoming page's own <typography-band> before the
  // persisted one replaces it: that transient element must leave nothing behind.
  it('binds nothing for an element connected and removed in the same task', async () => {
    const add = await spyTickerAdd();
    const { element } = mount();
    element.remove();
    await settle();

    expect(add).not.toHaveBeenCalled();
    expect(loadGsap).not.toHaveBeenCalled();
  });
});
