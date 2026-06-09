'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

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
const DURATION = 0.5;

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type BaseProps = {
  children: string;
  className?: string;
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
// glyphs never reflow surrounding layout (see styles). `aria-label` pins the
// accessible name to the text so an ancestor link's name stays stable while the
// glyphs churn (and reduced-motion users just see the plain text).
export const ScrambleText = (props: Props) => {
  const { children, className } = props;
  const rootRef = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);

  // For 'self' the host is the text's own span (resolved at effect time); for
  // 'group' it is the passed element. Tracked in deps so a late-arriving host
  // re-binds the listener.
  const host = props.trigger === 'group' ? props.host : null;

  useGSAP(
    (_context, contextSafe) => {
      if (contextSafe === undefined) return;

      // The decode tween. contextSafe so a tween created from a (deferred) event
      // listener or ScrollTrigger callback is added to the scope and reverted on
      // cleanup. revealDelay holds a short full scramble before decoding; low
      // speed keeps the glyph refresh chunky (digital); tweenLength off since the
      // text length never changes. data-scrambling pins the fill to one line for
      // the decode (see styles), dropping on complete to settle into wrapped text.
      const decode = contextSafe(() => {
        if (reduced()) return;
        const fill = fillRef.current;
        if (fill === null) return;
        gsap.to(fill, {
          duration: DURATION,
          ease: 'none',
          scrambleText: { text: children, chars: CHARS, speed: 0.5, revealDelay: 0.1, tweenLength: false },
          onStart: () => fill.setAttribute('data-scrambling', 'true'),
          onComplete: () => fill.removeAttribute('data-scrambling'),
          onInterrupt: () => fill.removeAttribute('data-scrambling'),
        });
      });

      const mm = gsap.matchMedia();

      // Desktop: decode on hover of the trigger host (the text itself for 'self',
      // a larger card for 'group'). Skip taps — touch fires a compatibility
      // pointerenter right before navigating, flashing the scramble for a frame.
      mm.add(DESKTOP, () => {
        const target = props.trigger === 'group' ? props.host : rootRef.current;
        if (target === null) return;
        const onPointerEnter = (event: PointerEvent) => {
          if (event.pointerType === 'touch') return;
          decode();
        };
        target.addEventListener('pointerenter', onPointerEnter);
        return () => target.removeEventListener('pointerenter', onPointerEnter);
      });

      // Mobile/tablet: no hover — decode once when the text scrolls into view.
      mm.add(MOBILE, () => {
        const trigger = rootRef.current;
        if (trigger === null) return;
        const st = ScrollTrigger.create({ trigger, start: 'top 90%', once: true, onEnter: () => decode() });
        return () => st.kill();
      });
    },
    { scope: rootRef, dependencies: [children, host] },
  );

  return (
    <span ref={rootRef} className={clsx(styles.root, className)} aria-label={children}>
      <span aria-hidden className={styles.ghost}>
        {children}
      </span>
      <span ref={fillRef} aria-hidden className={styles.fill}>
        {children}
      </span>
    </span>
  );
};
