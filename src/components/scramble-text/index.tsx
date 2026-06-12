'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

import { useBootReady } from '@components/boot-status';
import { prefersReducedMotion } from '@utils/prefers-reduced-motion';

import { clsx } from '@utils/clsx';

import * as styles from './styles.css';

gsap.registerPlugin(ScrambleTextPlugin, ScrollTrigger);

// Desktop hover starts here (768px = the `desktop` breakpoint). Below it there is
// no hover, so the decode is triggered once when the text scrolls into view.
const DESKTOP = '(min-width: 768px)';
const MOBILE = '(max-width: 767.98px)';

// Digital glyphs the text decodes through — the single shared set used by the
// EchoText wordmark and the PageHeader title, so every scramble across the site
// reads as one system.
const CHARS = '█▓▒░#%&@/\\<>0123456789';
// Desktop hover decode. Snappy because the user actively triggers it.
const DURATION = 0.5;
// Mobile/tablet in-view decode. Slower than desktop: the touch user does not
// trigger it, so a gentler reveal reads better as the text scrolls into view.
const MOBILE_DURATION = 1.2;

type BaseProps = {
  children: string;
  className?: string;
  // When set, the text clamps to 2 lines on mobile/tablet. The (hidden, in-flow)
  // ghost reserves that clamped height while the absolute fill decodes, so the
  // in-view scramble can never grow/shrink the box (no layout shift). Desktop is
  // unclamped — the ghost reserves the full title height there.
  clamp?: boolean;
  // When set, the text truncates to a single ellipsised line at every breakpoint.
  // A parent's `text-overflow:ellipsis` can't reach the painted (absolute) fill, so
  // the styles cap the root width and apply the ellipsis to BOTH the in-flow ghost
  // (reserves the capped line) and the fill (paints the "…"). Used by adjacent-nav.
  truncate?: boolean;
};

// The hover host is always passed as a value — never resolved by walking up the
// DOM — so when a scramble misfires the trigger source is obvious:
//   'self' (default) — the text scrambles on its own hover (the text IS the link).
//   'group'          — the text scrambles when `host` is hovered (a whole-card
//                      link larger than its title). Pass the host element via a
//                      callback ref + useState so it flows as a value: when the
//                      ancestor mounts, `host` updates and useGSAP re-binds (a
//                      RefObject would still be null in this child's effect, since
//                      an ancestor's ref is committed after the child's effects).
type Props = BaseProps & ({ trigger?: 'self' } | { trigger: 'group'; host: HTMLElement | null });

// Inline text that decodes through glitch glyphs on hover (a terminal/command-line
// reveal). Client Component — the scramble needs GSAP. The text is rendered as a
// width-reserving ghost plus an absolutely-overlaid animated copy, so the churning
// glyphs never reflow surrounding layout (see styles). A clipped srOnly copy carries
// the accessible name (both ghost and fill are aria-hidden), so an ancestor link's
// name stays stable while the glyphs churn — and the name survives even in plain
// text context, where `aria-label` on the generic root span would be prohibited.
export const ScrambleText = (props: Props) => {
  const { children, className, clamp, truncate } = props;
  const rootRef = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);

  // For 'self' the host is the text's own span (resolved at effect time); for
  // 'group' it is the passed element. Tracked in deps so a late-arriving host
  // re-binds the listener.
  const host = props.trigger === 'group' ? props.host : null;

  const bootReady = useBootReady();

  useGSAP(
    () => {
      // The raw decode tween body. revealDelay holds a short full scramble before
      // decoding; low speed keeps the glyph refresh chunky (digital); tweenLength
      // off since the text length never changes. data-scrambling clips the churning
      // fill to the ghost-reserved box for the decode (see styles) so a multi-line
      // title keeps wrapping, dropping on complete to settle into the resolved wrap.
      const runDecode = (duration: number) => {
        if (prefersReducedMotion()) return;
        const fill = fillRef.current;
        if (fill === null) return;
        gsap.to(fill, {
          duration,
          ease: 'none',
          scrambleText: { text: children, chars: CHARS, speed: 0.5, revealDelay: 0.1, tweenLength: false },
          onStart: () => fill.setAttribute('data-scrambling', 'true'),
          onComplete: () => fill.removeAttribute('data-scrambling'),
          onInterrupt: () => fill.removeAttribute('data-scrambling'),
        });
      };

      const mm = gsap.matchMedia();

      // decode is wrapped by each branch's OWN contextSafe — the matchMedia
      // condition context, never the outer useGSAP context. This matters because
      // the MOBILE ScrollTrigger fires onEnter synchronously during create (when
      // the text is already in view), i.e. while the conditional context is gsap's
      // active context. A decode owned by the outer context would be cross-linked
      // into the conditional context there (gsap runs `prev.data.push(self)`),
      // forming a U⇄C cycle that makes the unmount-time revert() recurse forever in
      // Context.getTweens (the "Maximum call stack size exceeded" on navigation).
      // Owning decode on the active conditional context keeps self === active, so
      // there is no cross-link and no cycle.

      // Desktop: decode on hover of the trigger host (the text itself for 'self',
      // a larger card for 'group'). Skip taps — touch fires a compatibility
      // pointerenter right before navigating, flashing the scramble for a frame.
      mm.add(DESKTOP, (_ctx, contextSafe) => {
        if (contextSafe === undefined) return;
        const decode = contextSafe(runDecode);
        const target = props.trigger === 'group' ? props.host : rootRef.current;
        if (target === null) return;
        const onPointerEnter = (event: PointerEvent) => {
          if (event.pointerType === 'touch') return;
          decode(DURATION);
        };
        target.addEventListener('pointerenter', onPointerEnter);
        return () => target.removeEventListener('pointerenter', onPointerEnter);
      });

      // Mobile/tablet: no hover — decode once when the text scrolls into view.
      mm.add(MOBILE, (_ctx, contextSafe) => {
        if (contextSafe === undefined) return;
        if (!bootReady) return; // wait for the boot overlay to lift before the in-view decode
        const decode = contextSafe(runDecode);
        const trigger = rootRef.current;
        if (trigger === null) return;
        const st = ScrollTrigger.create({ trigger, start: 'top 90%', once: true, onEnter: () => decode(MOBILE_DURATION) });
        // Resizing up to desktop reverts this branch's decode tween. ScrambleTextPlugin's
        // revert does NOT restore the original text — it leaves the fill frozen on a
        // mid-scramble frame (e.g. `8/41/`) — and the desktop branch only binds a hover
        // listener, so it never re-renders; React won't reconcile a text node GSAP mutated
        // imperatively either, so the nav stays unreadable glyphs (also a WCAG fail). Heal
        // the resting text on teardown: this returned cleanup runs in Context.kill AFTER the
        // tween revert (gsap-core invokes the `_r` callbacks last), so it deterministically wins.
        return () => {
          st.kill();
          const fill = fillRef.current;
          if (fill === null) return;
          fill.removeAttribute('data-scrambling');
          fill.textContent = children;
        };
      });
    },
    { scope: rootRef, dependencies: [children, host, bootReady] },
  );

  return (
    <span ref={rootRef} className={clsx(styles.root, className)} data-clamp={clamp || undefined} data-truncate={truncate || undefined}>
      {/* Full text stays available to SR / crawlers; the ghost and fill are visual only. */}
      <span className={styles.srOnly}>{children}</span>
      <span aria-hidden className={styles.ghost}>
        {children}
      </span>
      <span ref={fillRef} aria-hidden className={styles.fill}>
        {children}
      </span>
    </span>
  );
};
