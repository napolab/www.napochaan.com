import { loadGsap } from '@utils/gsap';
import { prefersReducedMotion } from '@utils/prefers-reduced-motion';

import type { GsapKits } from '@utils/gsap';

// Framework-free core of the EchoText wordmark decode, shared by the React EchoText
// (./index.tsx) and the `<echo-text>` custom element (./element.ts). One module, so
// the two can never drift.

export const CHARS = '█▓▒░#%&@/\\<>0123456789';
export const DURATION = 1.1;

export type EchoBinding = {
  // The wordmark root: the gsap.context scope and the hover target.
  root: HTMLElement;
  // The `[data-scramble]` span whose text churns.
  fill: HTMLElement;
  // The resting wordmark the decode resolves to.
  text: string;
};

// The raw decode tween body (unchanged behaviour — see the CLS notes in git history:
// the box is pinned to the settled width for the tween's lifetime).
const decodeWith = ({ gsap }: GsapKits['scramble'], el: HTMLElement, text: string): void => {
  // The scramble glyphs vary in advance width, so the span's inline size jitters on
  // every refresh — nudging the trailing red dot (and the centered line box) each
  // tick, and every nudge counts toward CLS (this was the page's dominant layout-shift
  // source). Pin the box to the settled wordmark width for the tween's lifetime so the
  // jitter stays inside; the momentary overflow of a wide glyph reads as part of the
  // glitch. `overwrite` kills a still-running decode on hover re-entry so its
  // clearProps can't unlock the box mid-scramble.
  gsap.set(el, { display: 'inline-block', width: el.offsetWidth });
  // revealDelay holds the full scramble before decoding; low speed keeps the glyph
  // refresh chunky (digital) rather than a 60fps blur; tweenLength off since the word
  // length never changes.
  gsap.to(el, {
    duration: DURATION,
    ease: 'none',
    overwrite: true,
    scrambleText: { text, chars: CHARS, speed: 0.45, revealDelay: 0.35, tweenLength: false },
    onComplete: () => {
      gsap.set(el, { clearProps: 'display,width' });
    },
  });
};

// Puts the fill back at rest. A revert mid-decode leaves the text frozen on a
// scramble frame (ScrambleTextPlugin does not restore it) and the pinned box in place;
// unlike a React unmount the DOM outlives the teardown (motion toggle, persist move),
// so heal both.
export const healEcho = ({ fill, text }: EchoBinding): void => {
  fill.textContent = text;
  fill.style.removeProperty('display');
  fill.style.removeProperty('width');
};

// Decodes once and re-decodes on every pointerenter — mouse hover AND touch tap: it is
// a playful flourish, not a link, so there is no navigation to race (ScrambleText,
// which wraps links, skips touch). gsap is loaded lazily; a dispose that lands before
// the chunk resolves cancels the bind. Callers check the effective reduced-motion
// preference (and boot readiness) BEFORE calling this, so the gsap chunk is never
// requested for a reduced-motion visitor; the hover re-checks it too.
export const bindEcho = (binding: EchoBinding): (() => void) => {
  const state: { cancelled: boolean; teardown?: () => void } = { cancelled: false };

  const run = async () => {
    try {
      const bundle = await loadGsap('scramble');
      if (state.cancelled) return;
      const ctx = bundle.gsap.context(() => {}, binding.root);
      const decode = () => {
        if (prefersReducedMotion()) return;
        ctx.add(() => decodeWith(bundle, binding.fill, binding.text));
      };
      binding.root.addEventListener('pointerenter', decode);
      state.teardown = () => {
        binding.root.removeEventListener('pointerenter', decode);
        ctx.revert();
      };
      decode();
    } catch {
      // The scramble is decorative — a failed chunk load (e.g. a stale client after a
      // redeploy) degrades to static text. Nothing to recover.
    }
  };
  void run();

  return () => {
    state.cancelled = true;
    state.teardown?.();
    healEcho(binding);
  };
};
