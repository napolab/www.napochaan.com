import { loadGsap } from '@utils/gsap';
import { prefersReducedMotion } from '@utils/prefers-reduced-motion';

import type { GsapKits } from '@utils/gsap';

// Framework-free core of the ScrambleText decode, shared by the React `ScrambleText`
// (./index.tsx, for React islands such as sys-bar) and the `<scramble-text>` custom
// element (./element.ts, for `.astro`). One module, so the two can never drift.
//
// gsap is NOT loaded at bind. Detecting the trigger needs no gsap (a pointerenter
// listener on desktop, an IntersectionObserver on mobile), so the decode chunk (gsap
// core + ScrambleTextPlugin) is fetched on the first real trigger — a page whose
// visitor never hovers / scrolls to a ScrambleText never downloads it.

// Desktop hover starts here (768px = the `desktop` breakpoint). Below it there is
// no hover, so the decode is triggered once when the text scrolls into view.
export const DESKTOP = '(min-width: 768px)';

// Digital glyphs the text decodes through — the single shared set used by the
// EchoText wordmark and the PageHeader title, so every scramble across the site
// reads as one system.
export const CHARS = '█▓▒░#%&@/\\<>0123456789';
// Desktop hover decode. Snappy because the user actively triggers it.
export const DURATION = 0.5;
// Mobile/tablet in-view decode. Slower than desktop: the touch user does not
// trigger it, so a gentler reveal reads better as the text scrolls into view.
export const MOBILE_DURATION = 1.2;
// The in-view line: the text counts as "in view" once its top crosses 90% of the
// viewport height (the `start: 'top 90%'` the ScrollTrigger version used).
export const IN_VIEW_ROOT_MARGIN = '0px 0px -10% 0px';

export type ScrambleBinding = {
  // Root of the scramble markup: the gsap.context scope and the mobile in-view target.
  root: HTMLElement;
  // The absolutely-overlaid copy whose text churns.
  fill: HTMLElement;
  // The resting text the decode resolves to.
  text: string;
  // Desktop hover target: the root itself ('self') or a larger card ('group').
  // null skips the desktop branch (a 'group' host that has not resolved yet).
  host: HTMLElement | null;
  // Mobile in-view decode waits for the boot overlay to lift.
  bootReady: boolean;
};

// Sets / clears the clip hook the styles use while the fill churns.
const markScrambling = (fill: HTMLElement) => fill.setAttribute('data-scrambling', 'true');
const unmarkScrambling = (fill: HTMLElement) => fill.removeAttribute('data-scrambling');

// Puts the fill back on its resting text. ScrambleTextPlugin's revert does NOT restore
// the original text — it leaves the fill frozen on a mid-scramble frame (e.g. `8/41/`).
export const healFill = (fill: HTMLElement, text: string) => {
  unmarkScrambling(fill);
  fill.textContent = text;
};

type ScrambleKit = GsapKits['scramble'];

// The raw decode tween body. revealDelay holds a short full scramble before
// decoding; low speed keeps the glyph refresh chunky (digital); tweenLength off
// since the text length never changes. data-scrambling clips the churning fill to
// the ghost-reserved box for the decode (see styles) so a multi-line title keeps
// wrapping, dropping on complete to settle into the resolved wrap.
const tweenDecode = ({ gsap }: ScrambleKit, { fill, text }: ScrambleBinding, duration: number) => {
  gsap.to(fill, {
    duration,
    ease: 'none',
    scrambleText: { text, chars: CHARS, speed: 0.5, revealDelay: 0.1, tweenLength: false },
    onStart: () => markScrambling(fill),
    onComplete: () => unmarkScrambling(fill),
    onInterrupt: () => unmarkScrambling(fill),
  });
};

type Decoder = {
  // Loads gsap on first use, then runs one decode. Never rejects.
  decode: (duration: number) => Promise<void>;
  // Cancels a decode whose chunk is still loading and reverts a running one.
  dispose: () => void;
};

// One decoder per breakpoint branch, owning that branch's tweens in its own
// gsap.context (created once gsap has loaded). There is no gsap.matchMedia and no
// ScrollTrigger any more — branch switching is plain window.matchMedia and the trigger
// never runs inside a gsap context — so the outer/conditional context cross-link that
// once made revert() recurse forever ("Maximum call stack size exceeded") cannot form.
const createDecoder = (binding: ScrambleBinding): Decoder => {
  const state: { disposed: boolean; ctx: gsap.Context | undefined } = { disposed: false, ctx: undefined };

  const decode = async (duration: number) => {
    // Checked BEFORE loadGsap(): a reduced-motion visitor never fetches the chunk.
    if (prefersReducedMotion()) return;
    try {
      const kit = await loadGsap('scramble');
      if (state.disposed || prefersReducedMotion()) return;
      if (state.ctx === undefined) state.ctx = kit.gsap.context(() => {}, binding.root);
      state.ctx.add(() => tweenDecode(kit, binding, duration));
    } catch {
      // The scramble is decorative — a failed chunk load (e.g. a stale client after a
      // redeploy) degrades to static text. Nothing to recover.
    }
  };

  // ScrambleTextPlugin's revert leaves the fill frozen on a mid-scramble frame and the
  // other branch (desktop only binds a hover listener) never re-renders it; React won't
  // reconcile a text node gsap mutated either, so the text would stay unreadable glyphs
  // (also a WCAG fail). Heal it — but only when this branch actually tweened, so a
  // React re-render that already committed new text is never overwritten with the old.
  const dispose = () => {
    state.disposed = true;
    if (state.ctx === undefined) return;
    state.ctx.revert();
    healFill(binding.fill, binding.text);
  };

  return { decode, dispose };
};

type Branch = (binding: ScrambleBinding, decoder: Decoder) => () => void;

const noop = () => {};

// Desktop: decode on hover of the trigger host (the text itself for 'self', a larger
// card for 'group'). Skip taps — touch fires a compatibility pointerenter right before
// navigating, flashing the scramble for a frame (and would fetch gsap for nothing).
const bindDesktop: Branch = ({ host }, decoder) => {
  if (host === null) return noop;
  const onPointerEnter = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    void decoder.decode(DURATION);
  };
  host.addEventListener('pointerenter', onPointerEnter);
  return () => host.removeEventListener('pointerenter', onPointerEnter);
};

// Mobile/tablet: no hover — decode once when the text scrolls into view. An
// IntersectionObserver needs no gsap, so the chunk loads only when it fires.
const bindMobile: Branch = ({ root, bootReady }, decoder) => {
  if (!bootReady) return noop; // wait for the boot overlay to lift before the in-view decode
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect(); // once
      void decoder.decode(MOBILE_DURATION);
    },
    { rootMargin: IN_VIEW_ROOT_MARGIN },
  );
  observer.observe(root);
  return () => observer.disconnect();
};

// Binds the branch for the current breakpoint with a fresh decoder; returns its
// teardown (unbind the trigger, then dispose the decoder: revert + heal).
const bindBranch = (binding: ScrambleBinding, desktop: boolean) => {
  const decoder = createDecoder(binding);
  const unbind = (desktop ? bindDesktop : bindMobile)(binding, decoder);
  return () => {
    unbind();
    decoder.dispose();
  };
};

// Binds the hover / in-view decode and returns a synchronous dispose. Resizing across
// the breakpoint tears the current branch down and binds the other. gsap is loaded
// lazily on the first trigger; a dispose that lands before the chunk resolves cancels
// that decode. Callers check the effective reduced-motion preference BEFORE calling
// this; the trigger re-checks it before loading gsap.
export const bindScramble = (binding: ScrambleBinding): (() => void) => {
  const query = window.matchMedia(DESKTOP);
  const state: { teardown: () => void } = { teardown: noop };
  const rebind = () => {
    state.teardown();
    state.teardown = bindBranch(binding, query.matches);
  };
  query.addEventListener('change', rebind);
  rebind();

  return () => {
    query.removeEventListener('change', rebind);
    state.teardown();
    state.teardown = noop;
  };
};
