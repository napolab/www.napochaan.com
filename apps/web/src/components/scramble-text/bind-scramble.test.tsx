import { afterEach, describe, expect, it, vi } from 'vitest';

import { write } from '@utils/persistent-store';
import { MOTION_STORAGE_KEY } from '@utils/prefers-reduced-motion';

import { bindScramble } from './bind-scramble';

// Same delegating spy as scramble-text.test.tsx: the real gsap runs, but the call
// count / a rejection can be asserted per test.
const { loadGsap } = vi.hoisted(() => ({ loadGsap: vi.fn() }));
vi.mock('@utils/gsap', async () => {
  const actual = await vi.importActual<typeof import('@utils/gsap')>('@utils/gsap');
  loadGsap.mockImplementation(actual.loadGsap);
  return { loadGsap };
});

const original = window.matchMedia.bind(window);

// bindScramble reads window.matchMedia — force one branch regardless of viewport. The
// fake keeps its `change` listeners so a test can resize across the breakpoint.
const breakpoint = { mode: 'desktop' as 'desktop' | 'mobile', listeners: new Set<() => void>() };
const forceBreakpoint = (mode: 'desktop' | 'mobile') => {
  breakpoint.mode = mode;
  window.matchMedia = ((query: string) =>
    ({
      get matches() {
        return breakpoint.mode === 'mobile' ? query.includes('max-width') : query.includes('min-width');
      },
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: (_type: string, listener: () => void) => breakpoint.listeners.add(listener),
      removeEventListener: (_type: string, listener: () => void) => breakpoint.listeners.delete(listener),
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
};
const resizeTo = (mode: 'desktop' | 'mobile') => {
  breakpoint.mode = mode;
  for (const listener of breakpoint.listeners) listener();
};

// `offscreen` parks the root outside the viewport so the real (Playwright) cursor —
// left wherever an earlier test file put it — can never fire a trusted mouse
// pointerenter on it. Needed by the negative hover assertion, which would otherwise
// flake in the full run when the cursor happens to rest over the top-left corner.
// `below` parks it under the viewport instead (out of view for the mobile in-view
// trigger, yet still reachable by moving it back with `bringIntoView`).
const mount = (text: string, { offscreen = false, below = false }: { offscreen?: boolean; below?: boolean } = {}) => {
  const root = document.createElement('span');
  const fill = document.createElement('span');
  fill.textContent = text;
  root.appendChild(fill);
  if (offscreen) root.style.cssText = 'position: fixed; top: -1000px; left: -1000px;';
  if (below) root.style.cssText = 'position: fixed; top: 200vh; left: 0; display: inline-block;';
  document.body.appendChild(root);
  return { root, fill };
};

const flush = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));
// Waits for the (shared, cached) gsap chunk so a bind has settled — the first load in a
// fresh browser can take longer than a fixed delay.
const settle = async () => {
  const actual = await vi.importActual<typeof import('@utils/gsap')>('@utils/gsap');
  await actual.loadGsap('scramble');
  await flush();
};

const bringIntoView = (root: HTMLElement) => {
  root.style.top = '0px';
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
    // Non-disconnecting read for expect.poll.
    peek: () => state.started,
  };
};

const hover = (target: HTMLElement, pointerType: string) => target.dispatchEvent(new PointerEvent('pointerenter', { pointerType }));

describe('bindScramble', () => {
  afterEach(() => {
    window.matchMedia = original;
    breakpoint.listeners.clear();
    write(MOTION_STORAGE_KEY, null);
    document.body.replaceChildren();
    loadGsap.mockClear();
  });

  it('decodes on a mouse hover of the host on desktop', async () => {
    forceBreakpoint('desktop');
    const { root, fill } = mount('archive');
    const dispose = bindScramble({ root, fill, text: 'archive', host: root, bootReady: true });
    await settle();

    const decode = watchDecode(fill);
    hover(root, 'mouse');
    await settle();
    expect(decode.started).toBe(true);
    dispose();
  });

  it('ignores the compatibility pointerenter a tap fires on desktop', async () => {
    forceBreakpoint('desktop');
    const { root, fill } = mount('archive', { offscreen: true });
    const dispose = bindScramble({ root, fill, text: 'archive', host: root, bootReady: true });
    await settle();

    const decode = watchDecode(fill);
    hover(root, 'touch');
    await settle();
    expect(decode.started).toBe(false);
    dispose();
  });

  it('binds the hover to a separate host (trigger="group")', async () => {
    forceBreakpoint('desktop');
    const host = document.createElement('a');
    document.body.appendChild(host);
    const { root, fill } = mount('archive');
    host.appendChild(root);
    const dispose = bindScramble({ root, fill, text: 'archive', host, bootReady: true });
    await settle();

    const decode = watchDecode(fill);
    hover(host, 'mouse');
    await settle();
    expect(decode.started).toBe(true);
    dispose();
  });

  // gsap is fetched on the first intent, not at bind: a page whose visitor never
  // hovers a ScrambleText never downloads the decode.
  it('does not load gsap at bind on desktop, only on the first mouse hover', async () => {
    forceBreakpoint('desktop');
    const { root, fill } = mount('archive', { offscreen: true });
    const dispose = bindScramble({ root, fill, text: 'archive', host: root, bootReady: true });
    await flush();
    expect(loadGsap).not.toHaveBeenCalled();

    const decode = watchDecode(fill);
    hover(root, 'mouse');
    await settle();
    expect(loadGsap).toHaveBeenCalledWith('scramble');
    expect(decode.started).toBe(true);
    dispose();
  });

  it('does not load gsap for a tap on desktop', async () => {
    forceBreakpoint('desktop');
    const { root, fill } = mount('archive', { offscreen: true });
    const dispose = bindScramble({ root, fill, text: 'archive', host: root, bootReady: true });
    hover(root, 'touch');
    await flush();
    expect(loadGsap).not.toHaveBeenCalled();
    dispose();
  });

  it('never loads gsap for a hover once reduced motion is on', async () => {
    forceBreakpoint('desktop');
    const { root, fill } = mount('archive', { offscreen: true });
    const dispose = bindScramble({ root, fill, text: 'archive', host: root, bootReady: true });
    write(MOTION_STORAGE_KEY, false);
    hover(root, 'mouse');
    await flush();
    expect(loadGsap).not.toHaveBeenCalled();
    dispose();
  });

  it('does not decode when disposed while the chunk for a hover is still loading', async () => {
    forceBreakpoint('desktop');
    const { root, fill } = mount('archive', { offscreen: true });
    const dispose = bindScramble({ root, fill, text: 'archive', host: root, bootReady: true });
    const decode = watchDecode(fill);
    hover(root, 'mouse');
    dispose();
    await settle();
    expect(decode.started).toBe(false);
    expect(fill.textContent).toBe('archive');
  });

  // The in-view detection is an IntersectionObserver, so a mobile page loads gsap only
  // once a ScrambleText actually scrolls into view.
  it('does not load gsap on mobile until the text enters the viewport', async () => {
    forceBreakpoint('mobile');
    const { root, fill } = mount('archive', { below: true });
    const dispose = bindScramble({ root, fill, text: 'archive', host: root, bootReady: true });
    await flush(150);
    expect(loadGsap).not.toHaveBeenCalled();

    const decode = watchDecode(fill);
    bringIntoView(root);
    await expect.poll(decode.peek, { timeout: 5_000 }).toBe(true);
    expect(loadGsap).toHaveBeenCalledWith('scramble');
    dispose();
  });

  it('does not load gsap on mobile while boot is not ready, even in view', async () => {
    forceBreakpoint('mobile');
    const { root, fill } = mount('archive');
    const dispose = bindScramble({ root, fill, text: 'archive', host: root, bootReady: false });
    await flush(150);
    expect(loadGsap).not.toHaveBeenCalled();
    dispose();
  });

  // Resizing across the breakpoint swaps branches: the mobile decode is torn down
  // (healed, not frozen mid-scramble) and the desktop hover takes over.
  it('switches from the mobile in-view decode to the desktop hover on resize', async () => {
    forceBreakpoint('mobile');
    const { root, fill } = mount('archive');
    const dispose = bindScramble({ root, fill, text: 'archive', host: root, bootReady: true });
    await expect.poll(() => fill.hasAttribute('data-scrambling'), { timeout: 5_000 }).toBe(true);

    resizeTo('desktop');
    expect(fill.textContent).toBe('archive');
    expect(fill.hasAttribute('data-scrambling')).toBe(false);

    const decode = watchDecode(fill);
    hover(root, 'mouse');
    await settle();
    expect(decode.started).toBe(true);
    dispose();
  });

  it('decodes once in view on mobile, only after boot is ready', async () => {
    forceBreakpoint('mobile');
    const { root, fill } = mount('archive');
    const booting = bindScramble({ root, fill, text: 'archive', host: root, bootReady: false });
    await settle();
    expect(fill.hasAttribute('data-scrambling')).toBe(false);
    booting();

    const ready = bindScramble({ root, fill, text: 'archive', host: root, bootReady: true });
    await expect.poll(() => fill.hasAttribute('data-scrambling'), { timeout: 5_000 }).toBe(true);
    ready();
  });

  // ScrambleTextPlugin's revert leaves the fill frozen on a mid-scramble frame; the
  // mobile teardown must heal the resting text.
  it('heals the resting text when the mobile branch is torn down mid-decode', async () => {
    forceBreakpoint('mobile');
    const { root, fill } = mount('archive');
    const dispose = bindScramble({ root, fill, text: 'archive', host: root, bootReady: true });
    await expect.poll(() => fill.hasAttribute('data-scrambling'), { timeout: 5_000 }).toBe(true);
    dispose();

    expect(fill.textContent).toBe('archive');
    expect(fill.hasAttribute('data-scrambling')).toBe(false);
  });

  it('degrades silently to static text when the gsap chunk fails to load', async () => {
    loadGsap.mockRejectedValueOnce(new Error('Failed to fetch dynamically imported module'));
    forceBreakpoint('desktop');
    const { root, fill } = mount('archive');
    const captured: unknown[] = [];
    const onRejection = (event: PromiseRejectionEvent) => captured.push(event.reason);
    window.addEventListener('unhandledrejection', onRejection);

    const dispose = bindScramble({ root, fill, text: 'archive', host: root, bootReady: true });
    hover(root, 'mouse');
    await settle();
    dispose();
    window.removeEventListener('unhandledrejection', onRejection);

    expect(loadGsap).toHaveBeenCalled();
    expect(captured).toEqual([]);
    expect(fill.textContent).toBe('archive');
  });
});
