import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { withAppProviders } from '@components/app-providers';
import { getPresenceCount, isPresenceEnabled, PRESENCE_ENABLED_KEY, publishPresenceCount, togglePresenceEnabled } from '@components/cursor-presence/presence-count';
import { sharedLifeEngine } from '@components/game-of-life/shared-engine';
import { read, write } from '@utils/persistent-store';
import { MOTION_STORAGE_KEY } from '@utils/prefers-reduced-motion';

import { SYS_BAR_TAG, defineSysBarElement } from './element';
import { SysBar } from './index';

// The menu chunk must never load in these tests (no trigger intent): a tripwire.
const { menuLoads } = vi.hoisted(() => ({ menuLoads: { count: 0 } }));
vi.mock('./nav-menu/mount', async (importOriginal) => {
  menuLoads.count += 1;
  return importOriginal();
});

// sys-bar.astro renders the React SysBar markup (asserted by sys-bar.astro.test.ts)
// inside <sys-bar>; build the same fixture from the React reference.
const SysBarAt = withAppProviders(SysBar);
const INITIAL_TIME = '12:34:56';

const mount = (pathname = '/works') => {
  const container = document.createElement('div');
  // Offscreen: a resting real cursor must not hover the menu trigger.
  container.style.cssText = 'position: fixed; top: -1000px; left: -1000px;';
  container.innerHTML = `<${SYS_BAR_TAG}>${renderToStaticMarkup(createElement(SysBarAt, { pathname, props: { initialTime: INITIAL_TIME } }))}</${SYS_BAR_TAG}>`;
  document.body.appendChild(container);
  const element = container.querySelector(SYS_BAR_TAG);
  if (element === null) throw new Error('not rendered');
  const field = (selector: string) => {
    const node = element.querySelector<HTMLElement>(selector);
    if (node === null) throw new Error(`${selector} not rendered`);
    return node;
  };
  return { container, element, field };
};

const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const activeHrefs = (element: Element) => [...element.querySelectorAll('nav a[data-active="true"]')].map((link) => link.getAttribute('href'));
const motionPlay = () => document.documentElement.style.getPropertyValue('--motion-play');

describe('<sys-bar>', () => {
  const initialPath = `${location.pathname}${location.search}`;

  beforeEach(() => {
    defineSysBarElement();
  });

  afterEach(async () => {
    document.body.replaceChildren();
    await settle();
    vi.useRealTimers();
    history.replaceState(null, '', initialPath);
    publishPresenceCount(0);
    write(PRESENCE_ENABLED_KEY, true);
    write(MOTION_STORAGE_KEY, null);
    localStorage.clear();
    document.documentElement.style.removeProperty('--motion-play');
    document.cookie = 'motion=; path=/; max-age=0';
    expect(menuLoads.count).toBe(0);
  });

  it('registers once (re-running the bundled script is a no-op)', () => {
    expect(() => defineSysBarElement()).not.toThrow();
    expect(customElements.get(SYS_BAR_TAG)).toBeDefined();
  });

  // Same as the React island: the server's stamped time is the first paint, then the
  // live Asia/Tokyo clock takes over right away and ticks every second.
  it('switches the stamped server time to the live clock and ticks it', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const { field } = mount();
    expect(field('[data-status="clock"]').textContent).toBe(INITIAL_TIME);
    await settle();
    expect(field('[data-status="clock"]').textContent).toBe('09:00:00');

    vi.advanceTimersByTime(1000);
    expect(field('[data-status="clock"]').textContent).toBe('09:00:01');
  });

  it('mirrors the shared life engine (fed by <game-of-life>)', async () => {
    const { field } = mount();
    await settle();

    const state = sharedLifeEngine.tick();
    expect(field('[data-status="gen"]').textContent).toBe(`gen ${`${state.generation}`.padStart(4, '0')}`);
    expect(field('[data-status="alive"]').textContent).toBe(`alive ${state.alive}`);
  });

  it('shows the presence count published by <cursor-presence>', async () => {
    const { field } = mount();
    await settle();

    publishPresenceCount(4);
    expect(field('[data-status="watching"]').textContent).toBe('watching 4');
    expect(getPresenceCount()).toBe(4);
  });

  it('flips the cursors opt-out and follows it when it changes elsewhere', async () => {
    const { field } = mount();
    await settle();
    const button = field('[data-toggle="cursors"]');

    button.click();
    expect(isPresenceEnabled()).toBe(false);
    expect(button.textContent).toBe('cursors: off');

    togglePresenceEnabled();
    expect(button.textContent).toBe('cursors: on');
  });

  it('flips motion for every element: persists the override, mirrors the boot cookie and --motion-play', async () => {
    const { field } = mount();
    await settle();
    const button = field('[data-toggle="motion"]');
    expect(motionPlay()).toBe('running');

    button.click();
    expect(button.textContent).toBe('motion: off');
    expect(read(MOTION_STORAGE_KEY, null)).toBe(false);
    expect(document.cookie).toContain('motion=off');
    expect(motionPlay()).toBe('paused');

    button.click();
    expect(button.textContent).toBe('motion: on');
    expect(motionPlay()).toBe('running');
  });

  // The server always paints both toggles on (it cannot know the visitor's choice).
  it('shows the stored choices as soon as it connects', async () => {
    write(MOTION_STORAGE_KEY, false);
    write(PRESENCE_ENABLED_KEY, false);
    const { field } = mount();
    await settle();

    expect(field('[data-toggle="motion"]').textContent).toBe('motion: off');
    expect(field('[data-toggle="cursors"]').textContent).toBe('cursors: off');
  });

  // Persisted, the bar never re-renders from the server: the active section follows
  // the soft navigation.
  it('moves the active section after each soft navigation', async () => {
    history.replaceState(null, '', '/works');
    const { element } = mount('/works');
    await settle();
    expect(activeHrefs(element)).toEqual(['/works']);

    history.replaceState(null, '', '/blog/some-post');
    document.dispatchEvent(new Event('astro:page-load'));
    expect(activeHrefs(element)).toEqual(['/blog']);

    history.replaceState(null, '', '/');
    document.dispatchEvent(new Event('astro:page-load'));
    expect(activeHrefs(element)).toEqual(['/']);
  });

  // transition:persist moves the bar (to <html>, then into the new body): each move is
  // a synchronous disconnect + connect. A second binding would flip a toggle twice per
  // click (net: nothing) and run a second clock.
  it('survives a synchronous persist move without double-binding', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const { container, field } = mount();
    await settle();

    document.documentElement.appendChild(container);
    document.body.appendChild(container);
    await settle();

    field('[data-toggle="cursors"]').click();
    expect(isPresenceEnabled()).toBe(false);
    expect(vi.getTimerCount()).toBe(1);
    const state = sharedLifeEngine.tick();
    expect(field('[data-status="gen"]').textContent).toBe(`gen ${`${state.generation}`.padStart(4, '0')}`);
  });

  it('lets go of every store when it is really removed', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const { element, field } = mount();
    await settle();
    element.remove();
    await settle();

    expect(vi.getTimerCount()).toBe(0);
    const before = field('[data-status="gen"]').textContent;
    sharedLifeEngine.tick();
    expect(field('[data-status="gen"]').textContent).toBe(before);
    field('[data-toggle="cursors"]').click();
    expect(isPresenceEnabled()).toBe(true);
  });

  // The swap briefly connects the incoming page's own <sys-bar> before the persisted
  // one replaces it: that transient element must bind nothing.
  it('binds nothing for an element connected and removed in the same task', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const { element, field } = mount();
    element.remove();
    await settle();

    expect(vi.getTimerCount()).toBe(0);
    expect(field('[data-status="clock"]').textContent).toBe(INITIAL_TIME);
  });
});
