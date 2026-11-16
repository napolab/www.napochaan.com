import { wrap } from './band-scroll';
import { startFrameLoop } from './frame-loop';
import { createScrollVelocity, type ScrollVelocity } from './scroll-velocity';

// Framework-free core of the TypographyBand drift + grid snap, shared by the React
// TypographyBand (./index.tsx) and the `<typography-band>` custom element
// (./element.ts). One module, so the two can never drift.
//
// No gsap: the band is in the site shell on every page, and it used to be the only
// reason a page fetched gsap core + ScrollTrigger + ScrollToPlugin. Each piece is a
// small rAF / listener replica of what those did, with the same timing semantics:
// gsap.ticker → ./frame-loop (incl. lagSmoothing), ScrollTrigger.getVelocity →
// ./scroll-velocity, gsap.to(window, { scrollTo }) → tweenScrollTo below.

const VELOCITY_SCALE = 0.04;
const BASE_DRIFT = 0.35; // constant px-per-60fps-frame so the band always moves
const VEL_DECAY = 0.9; // scroll-velocity boost decays back to the base drift
const FRAME_MS = 1000 / 60;
const GRID = 24; // Game-of-Life cell size; snap scroll to its multiples on rest
const SNAP_DELAY = 140;
const SNAP_DURATION_MS = 300;
// ScrollTrigger re-samples the scroll position every 250ms once scroll events have been
// quiet for 34ms (its `_sync` interval), which keeps the velocity baseline fresh.
const IDLE_SYNC_MS = 250;
const IDLE_AFTER_MS = 34;
const BEFORE_SWAP_EVENT = 'astro:before-swap';

export type BandTracks = {
  top: HTMLElement;
  bottom: HTMLElement;
  left: HTMLElement;
  right: HTMLElement;
};

// gsap's CSSPlugin rounds transform values to 4 decimals.
const round = (value: number) => Math.round(value * 10_000) / 10_000;

// Exactly the string gsap.set(el, { x }) / ({ y }) produced: a 2D translate() in px
// (force3D "auto" only goes 3D mid-tween; a set renders at ratio 1). The tracks carry
// `will-change: transform`, so compositing is unchanged. An imperative per-frame DOM
// write, not a JSX style prop — dynamic-styles.md governs the latter.
const setTranslate = (element: HTMLElement, x: number, y: number) => {
  element.style.transform = `translate(${round(x)}px, ${round(y)}px)`;
};

// power2.out
const easeOut = (progress: number) => 1 - (1 - progress) ** 2;

// Runs `fn` just after the next frame has rendered (rAF → task), when layout is clean
// and a layout read is free. Returns the cancel.
const afterNextFrame = (fn: () => void): (() => void) => {
  const handle: { raf: number; timer: ReturnType<typeof setTimeout> | undefined } = { raf: 0, timer: undefined };
  handle.raf = requestAnimationFrame(() => {
    handle.timer = setTimeout(fn, 0);
  });

  return () => {
    cancelAnimationFrame(handle.raf);
    clearTimeout(handle.timer);
  };
};

// The scroll-velocity boost: ScrollTrigger.create({ onUpdate: (self) => boost =
// self.getVelocity() * VELOCITY_SCALE }) without the plugin. `update` is what
// ScrollTrigger.update() did (the old scrollTo tween called it on every render).
//
// Layout reads: reading scrollY flushes a pending layout, and the band binds while the
// page's first layout is still pending. So the baseline is seeded just after the first
// frame (or by an earlier scroll event), and the 250ms idle sample — which only keeps
// the velocity baseline fresh — reuses the last position a scroll event (or a snap
// write) read: with no scroll event since, the position cannot have changed. Only
// scroll events and snap writes read scrollY.
const bindBoost = () => {
  const state: { boost: number; lastScrollEvent: number; scroll: number; velocity: ScrollVelocity | undefined } = {
    boost: 0,
    lastScrollEvent: Number.NEGATIVE_INFINITY,
    scroll: 0,
    velocity: undefined,
  };

  const sampleAt = (scroll: number) => {
    state.scroll = scroll;
    const now = performance.now();
    if (state.velocity === undefined) {
      state.velocity = createScrollVelocity(scroll, now);
      return;
    }
    const value = state.velocity.sample(scroll, now);
    if (value === undefined) return;
    state.boost = value * VELOCITY_SCALE;
  };

  const update = () => sampleAt(window.scrollY);

  const seed = () => {
    if (state.velocity === undefined) update();
  };

  const onScroll = () => {
    state.lastScrollEvent = performance.now();
    update();
  };

  const onIdle = () => {
    if (state.velocity === undefined) return;
    if (performance.now() - state.lastScrollEvent <= IDLE_AFTER_MS) return;
    sampleAt(state.scroll);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  const interval = setInterval(onIdle, IDLE_SYNC_MS);
  const cancelSeed = afterNextFrame(seed);

  return {
    state,
    update,
    dispose: () => {
      cancelSeed();
      window.removeEventListener('scroll', onScroll);
      clearInterval(interval);
    },
  };
};

type Halves = { top: number | undefined; left: number | undefined };

// The halves of the duplicated tracks, measured from a ResizeObserver: its callback
// runs right after a layout, so scrollWidth / scrollHeight there are free (on the first
// frame they forced a layout), and a later size change — the Typekit face swapping in
// — re-measures. Returns the unobserve.
const observeHalves = (tracks: BandTracks, halves: Halves): (() => void) => {
  const observer = new ResizeObserver(() => {
    halves.top = tracks.top.scrollWidth / 2;
    halves.left = tracks.left.scrollHeight / 2;
  });
  observer.observe(tracks.top);
  observer.observe(tracks.left);

  return () => {
    observer.disconnect();
  };
};

type Boost = ReturnType<typeof bindBoost>;

// The drift: pos accumulates a constant drift plus a decaying scroll-velocity boost.
// We write the transform + wrap each frame (instant) so the duplicated track loops
// seamlessly — no smoothing across the wrap boundary, so the text never scrolls out
// and shows a blank gap before looping. The tracks hold still until the halves are
// measured (the first observation lands before the first frame paints).
const bindDrift = (tracks: BandTracks, boost: Boost['state']) => {
  const pos = { top: 0, bottom: 0, left: 0, right: 0 };
  const halves: Halves = { top: undefined, left: undefined };
  const unobserve = observeHalves(tracks, halves);

  const tick = (deltaMs: number) => {
    const { top: topHalf, left: leftHalf } = halves;
    if (topHalf === undefined || leftHalf === undefined) return;
    const step = (BASE_DRIFT + boost.boost) * (deltaMs / FRAME_MS);
    boost.boost *= VEL_DECAY;
    // Clockwise rotation around the frame: top ← / right ↑ / bottom → / left ↓
    pos.top = wrap(pos.top - step, topHalf);
    pos.bottom = wrap(pos.bottom + step, topHalf);
    pos.left = wrap(pos.left + step, leftHalf);
    pos.right = wrap(pos.right - step, leftHalf);
    setTranslate(tracks.top, pos.top, 0);
    setTranslate(tracks.bottom, pos.bottom, 0);
    setTranslate(tracks.left, 0, pos.left);
    setTranslate(tracks.right, 0, pos.right);
  };

  const stopLoop = startFrameLoop(tick);

  return () => {
    stopLoop();
    unobserve();
  };
};

// gsap.to(window, { duration: 0.3, ease: 'power2.out', scrollTo: target }) — ScrollToPlugin
// with its defaults: y only, x kept at the live scrollX, no autoKill (off unless set),
// negative y clamped to 0, positional window.scrollTo(x, y) (so a CSS
// `scroll-behavior: smooth` applies exactly as it did — the plugin's smooth guard only
// inspects elements, never window), ScrollTrigger.update() after every write.
const tweenScrollTo = (target: number, onWrite: () => void): (() => void) => {
  const from = window.scrollY;
  const state: { elapsed: number; stop: () => void } = { elapsed: 0, stop: () => undefined };

  state.stop = startFrameLoop((deltaMs) => {
    state.elapsed += deltaMs;
    const progress = Math.min(1, state.elapsed / SNAP_DURATION_MS);
    const y = progress === 1 ? target : from + (target - from) * easeOut(progress);
    window.scrollTo(window.scrollX, Math.max(0, y));
    onWrite();
    if (progress === 1) state.stop();
  });

  return () => state.stop();
};

// Snap the page scroll to the Game-of-Life 24px grid once scrolling rests, so the
// scrolling content grid lines up with the fixed living grid. The snap is
// interruptible: any real user input (wheel/touch/key) kills an in-flight snap and
// defers the next one, so it never fights the user.
const bindSnap = (onWrite: () => void) => {
  const snap: { timer: ReturnType<typeof setTimeout> | undefined; stopTween: (() => void) | undefined } = {
    timer: undefined,
    stopTween: undefined,
  };

  const cancelSnap = () => {
    snap.stopTween?.();
    snap.stopTween = undefined;
    clearTimeout(snap.timer);
  };

  const onScroll = () => {
    clearTimeout(snap.timer);
    snap.timer = setTimeout(() => {
      const y = window.scrollY;
      const target = Math.round(y / GRID) * GRID;
      if (Math.abs(target - y) <= 0.5) return;
      // Defensive: never run two snap tweens at once (a new scroll event already
      // re-arms the timer; the tween's own writes do too).
      snap.stopTween?.();
      snap.stopTween = tweenScrollTo(target, onWrite);
    }, SNAP_DELAY);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('wheel', cancelSnap, { passive: true });
  window.addEventListener('touchstart', cancelSnap, { passive: true });
  window.addEventListener('keydown', cancelSnap);
  // The band persists across navigations: an in-flight snap would otherwise keep
  // tweening toward the old page's offset after ClientRouter jumps to the top.
  document.addEventListener(BEFORE_SWAP_EVENT, cancelSnap);

  return () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('wheel', cancelSnap);
    window.removeEventListener('touchstart', cancelSnap);
    window.removeEventListener('keydown', cancelSnap);
    document.removeEventListener(BEFORE_SWAP_EVENT, cancelSnap);
    cancelSnap();
  };
};

// Binds the drift loop + velocity boost + grid snap synchronously and returns a
// synchronous dispose (cancels the frame loops, the idle-sync interval, the snap timer
// and every listener). Callers check the effective reduced-motion preference BEFORE
// calling this, so a reduced-motion visitor gets no loop and no listeners at all.
export const bindBand = (tracks: BandTracks): (() => void) => {
  const boost = bindBoost();
  const stopDrift = bindDrift(tracks, boost.state);
  const disposeSnap = bindSnap(boost.update);

  return () => {
    stopDrift();
    disposeSnap();
    boost.dispose();
  };
};
