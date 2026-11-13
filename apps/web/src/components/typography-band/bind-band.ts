import { loadGsap } from '@utils/gsap';

import { wrap } from './band-scroll';

import type { GsapKits } from '@utils/gsap';

type ScrollKit = GsapKits['scroll'];

// Framework-free core of the TypographyBand drift + grid snap, shared by the React
// TypographyBand (./index.tsx) and the `<typography-band>` custom element
// (./element.ts). One module, so the two can never drift.

const VELOCITY_SCALE = 0.04;
const BASE_DRIFT = 0.35; // constant px-per-60fps-frame so the band always moves
const VEL_DECAY = 0.9; // scroll-velocity boost decays back to the base drift
const FRAME_MS = 1000 / 60;
const GRID = 24; // Game-of-Life cell size; snap scroll to its multiples on rest
const SNAP_DELAY = 140;
const BEFORE_SWAP_EVENT = 'astro:before-swap';

type Tween = ReturnType<ScrollKit['gsap']['to']>;

export type BandTracks = {
  top: HTMLElement;
  bottom: HTMLElement;
  left: HTMLElement;
  right: HTMLElement;
};

// The drift: pos accumulates a constant drift plus a decaying scroll-velocity boost.
// We render with gsap.set + wrap each frame (instant) so the duplicated track loops
// seamlessly — no smoothing across the wrap boundary, so the text never scrolls out
// and shows a blank gap before looping.
const bindDrift = ({ gsap, ScrollTrigger }: ScrollKit, tracks: BandTracks) => {
  const topHalf = tracks.top.scrollWidth / 2;
  const leftHalf = tracks.left.scrollHeight / 2;
  const pos = { top: 0, bottom: 0, left: 0, right: 0 };
  const boost = { value: 0 };

  const trigger = ScrollTrigger.create({
    onUpdate: (self) => {
      boost.value = self.getVelocity() * VELOCITY_SCALE;
    },
  });

  const tick = (_time: number, deltaMs: number) => {
    const step = (BASE_DRIFT + boost.value) * (deltaMs / FRAME_MS);
    boost.value *= VEL_DECAY;
    // Clockwise rotation around the frame: top ← / right ↑ / bottom → / left ↓
    pos.top = wrap(pos.top - step, topHalf);
    pos.bottom = wrap(pos.bottom + step, topHalf);
    pos.left = wrap(pos.left + step, leftHalf);
    pos.right = wrap(pos.right - step, leftHalf);
    gsap.set(tracks.top, { x: pos.top });
    gsap.set(tracks.bottom, { x: pos.bottom });
    gsap.set(tracks.left, { y: pos.left });
    gsap.set(tracks.right, { y: pos.right });
  };
  gsap.ticker.add(tick);

  return () => {
    gsap.ticker.remove(tick);
    trigger.kill();
  };
};

// Snap the page scroll to the Game-of-Life 24px grid once scrolling rests, so the
// scrolling content grid lines up with the fixed living grid. The snap is
// interruptible: any real user input (wheel/touch/key) kills an in-flight snap and
// defers the next one, so it never fights the user.
const bindSnap = ({ gsap }: ScrollKit) => {
  const snap = { timer: undefined as ReturnType<typeof setTimeout> | undefined, tween: undefined as Tween | undefined };

  const cancelSnap = () => {
    snap.tween?.kill();
    snap.tween = undefined;
    clearTimeout(snap.timer);
  };

  const onScroll = () => {
    clearTimeout(snap.timer);
    snap.timer = setTimeout(() => {
      const y = window.scrollY;
      const target = Math.round(y / GRID) * GRID;
      if (Math.abs(target - y) <= 0.5) return;
      snap.tween = gsap.to(window, {
        duration: 0.3,
        ease: 'power2.out',
        scrollTo: target,
        onComplete: () => {
          snap.tween = undefined;
        },
      });
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

// Binds the drift ticker + grid snap and returns a synchronous dispose. gsap is loaded
// lazily (dynamic import); a dispose that lands before the chunk resolves cancels the
// bind. Callers check the effective reduced-motion preference BEFORE calling this, so
// the gsap chunk is never requested for a reduced-motion visitor.
export const bindBand = (tracks: BandTracks): (() => void) => {
  const state: { cancelled: boolean; cleanups: (() => void)[] } = { cancelled: false, cleanups: [] };

  const run = async () => {
    try {
      const bundle = await loadGsap('scroll');
      if (state.cancelled) return;
      state.cleanups = [bindDrift(bundle, tracks), bindSnap(bundle)];
    } catch {
      // The band is decorative — a failed chunk load (e.g. a stale client after a
      // redeploy) degrades to a static (non-drifting) band. Nothing to recover.
    }
  };
  void run();

  return () => {
    state.cancelled = true;
    for (const cleanup of state.cleanups) cleanup();
    state.cleanups = [];
  };
};
