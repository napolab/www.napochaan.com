import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { write } from '@utils/persistent-store';
import { MOTION_STORAGE_KEY } from '@utils/prefers-reduced-motion';

import { TYPOGRAPHY_BAND_TAG, defineTypographyBandElement } from './element';

// Tripwire: the band must never reach the gsap loader (no import, no call).
const { loadGsap } = vi.hoisted(() => ({ loadGsap: vi.fn() }));
vi.mock('@utils/gsap', () => ({ loadGsap }));

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
// Each bindBand() adds its window `scroll` listeners (velocity boost + grid snap) once,
// so counting them tells how many times the band was bound.
const spyScrollListeners = () => {
  const add = vi.spyOn(window, 'addEventListener');
  // The spy is typed from the last addEventListener overload; the runtime type is any string.
  return () => add.mock.calls.filter(([type]) => `${type}` === 'scroll').length;
};

const firstTrack = (element: Element) => {
  const track = element.querySelector('div > div');
  if (!(track instanceof HTMLElement)) throw new Error('track not rendered');
  return track;
};

// Whether the drift loop is still moving the track.
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
    expect(loadGsap).not.toHaveBeenCalled();
  });

  it('registers once (re-running the bundled script is a no-op)', () => {
    expect(() => defineTypographyBandElement()).not.toThrow();
    expect(customElements.get(TYPOGRAPHY_BAND_TAG)).toBeDefined();
  });

  it('drifts the tracks without loading gsap', async () => {
    const { element } = mount();
    const track = firstTrack(element);

    await expect.poll(() => track.style.transform, { timeout: 3000 }).toMatch(/translate/);
    expect(loadGsap).not.toHaveBeenCalled();
  });

  // The page-level bug this element fixes: the React island's first (hydration) effect
  // saw the server snapshot reduced=false and bound the band on every page.
  it('binds nothing while reduced motion is on, and starts once it is turned off', async () => {
    const scrollListeners = spyScrollListeners();
    write(MOTION_STORAGE_KEY, false);
    const { element } = mount();
    await flush();
    expect(scrollListeners()).toBe(0);
    expect(await isDrifting(firstTrack(element))).toBe(false);

    write(MOTION_STORAGE_KEY, true);
    await flush();
    expect(scrollListeners()).toBeGreaterThan(0);
    expect(await isDrifting(firstTrack(element))).toBe(true);
  });

  it('stops the drift when reduced motion is turned on', async () => {
    const { element } = mount();
    await flush();
    expect(await isDrifting(firstTrack(element))).toBe(true);

    write(MOTION_STORAGE_KEY, false);
    expect(await isDrifting(firstTrack(element))).toBe(false);
  });

  // transition:persist moves the element (to <html>, then into the new body): each
  // move is a synchronous disconnect + connect. The band must keep drifting from where
  // it was — no teardown, no second loop.
  it('survives a synchronous persist move without rebinding or leaking a loop', async () => {
    const scrollListeners = spyScrollListeners();
    const { container, element } = mount();
    await flush();
    const bound = scrollListeners();
    expect(bound).toBeGreaterThan(0);
    await flush(150);
    const offset = firstTrack(element).style.transform;

    document.documentElement.appendChild(element);
    container.appendChild(element);
    await flush();

    expect(scrollListeners()).toBe(bound);
    // Continuous: still drifting, and not reset back to the origin.
    expect(await isDrifting(firstTrack(element))).toBe(true);
    expect(firstTrack(element).style.transform).not.toBe(offset);
    expect(firstTrack(element).style.transform).not.toMatch(/translate\(0px, 0px\)|translate3d\(0px, 0px/);
  });

  it('stops its frame loop when it is really removed', async () => {
    const { element } = mount();
    await flush();
    expect(await isDrifting(firstTrack(element))).toBe(true);

    element.remove();
    await flush();
    expect(await isDrifting(firstTrack(element))).toBe(false);
  });

  // The swap briefly connects the incoming page's own <typography-band> before the
  // persisted one replaces it: that transient element must leave nothing behind.
  it('binds nothing for an element connected and removed in the same task', async () => {
    const scrollListeners = spyScrollListeners();
    const { element } = mount();
    element.remove();
    await flush();

    expect(scrollListeners()).toBe(0);
    expect(await isDrifting(firstTrack(element))).toBe(false);
  });
});
