'use client';

import { useCallback, useEffect, useRef } from 'react';

import { useBootReady } from '@components/boot-status';
import { usePrefersReducedMotion } from '@hooks/use-prefers-reduced-motion';
import { loadGsap } from '@utils/gsap';
import { prefersReducedMotion } from '@utils/prefers-reduced-motion';

import * as styles from './styles.css';

import type { GsapBundle } from '@utils/gsap';

const CHARS = '█▓▒░#%&@/\\<>0123456789';
const DURATION = 1.1;

type Props = {
  children: string;
  // Visual scale. 'hero' is the full display wordmark (default); 'compact' is a
  // smaller h1-scale rendering with proportionally tighter echo offsets, for
  // places that can't host the full-bleed size (e.g. the colophon demo cell).
  size?: 'hero' | 'compact';
};

// The raw decode tween body (unchanged behaviour — see the CLS notes in git
// history: the box is pinned to the settled width for the tween's lifetime).
const decodeWith = ({ gsap }: GsapBundle, el: HTMLElement, text: string): void => {
  // The scramble glyphs vary in advance width, so the span's inline size
  // jitters on every refresh — nudging the trailing red dot (and the centered
  // line box) each tick, and every nudge counts toward CLS (this was the
  // page's dominant layout-shift source). Pin the box to the settled wordmark
  // width for the tween's lifetime so the jitter stays inside; the momentary
  // overflow of a wide glyph reads as part of the glitch. `overwrite` kills a
  // still-running decode on hover re-entry so its clearProps can't unlock the
  // box mid-scramble.
  gsap.set(el, { display: 'inline-block', width: el.offsetWidth });
  // revealDelay holds the full scramble before decoding; low speed keeps the
  // glyph refresh chunky (digital) rather than a 60fps blur; tweenLength off
  // since the word length never changes.
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

export const EchoText = ({ children, size = 'hero' }: Props) => {
  const rootRef = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  // gsap.context scoped to the root; created once the bundle has loaded and reverted on unmount.
  const contextRef = useRef<gsap.Context | null>(null);
  const bootReady = useBootReady();
  // Effective reduced-motion (OS setting + the header motion toggle). Checked
  // BEFORE loadGsap() in both the mount effect and the hover callback below so
  // the gsap chunk is never imported at all for a reduced-motion visitor — not
  // merely no-op'd after loading.
  const reduced = usePrefersReducedMotion();

  const decode = useCallback(async () => {
    if (reduced) return;
    if (prefersReducedMotion()) return;
    try {
      const bundle = await loadGsap();
      const el = fillRef.current;
      const ctx = contextRef.current;
      if (el === null || ctx === null) return;
      ctx.add(() => decodeWith(bundle, el, children));
    } catch {
      // The scramble is decorative — a failed chunk load (e.g. a stale client
      // after a redeploy) degrades to static text. Nothing to recover.
    }
  }, [children, reduced]);

  useEffect(() => {
    // USEEFFECT_JUSTIFICATION: imperative gsap context setup on the root DOM
    // node, loaded lazily (dynamic import) after mount and only once the boot
    // overlay has lifted.
    if (!bootReady) return;
    if (reduced) return;
    const state = { cancelled: false };
    const run = async () => {
      try {
        const bundle = await loadGsap();
        if (state.cancelled) return;
        contextRef.current = bundle.gsap.context(() => {}, rootRef);
        await decode();
      } catch {
        // The scramble is decorative — a failed chunk load degrades to static
        // text. Nothing to recover.
      }
    };
    void run();

    return () => {
      state.cancelled = true;
      contextRef.current?.revert();
      contextRef.current = null;
    };
  }, [bootReady, decode, reduced]);

  // pointerenter fires for every pointer type, so the wordmark re-decodes on a
  // mouse hover AND a touch tap — it's a playful flourish, not a link, so there
  // is no navigation to race. (ScrambleText, which wraps links, skips touch.)
  const handleEnter = useCallback(async () => {
    await decode();
  }, [decode]);

  return (
    <span ref={rootRef} data-size={size} className={styles.root} role="img" aria-label={children} onPointerEnter={handleEnter}>
      <span aria-hidden data-size={size} className={styles.echoOut}>
        {children}
      </span>
      <span aria-hidden data-size={size} className={styles.echoBlue}>
        {children}
      </span>
      <span aria-hidden className={styles.fill}>
        <span ref={fillRef} data-scramble>
          {children}
        </span>
        <span className={styles.red}>.</span>
      </span>
    </span>
  );
};
