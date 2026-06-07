'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { useGSAP } from '@gsap/react';

import { clsx } from '@utils/clsx';

import * as styles from './styles.css';

gsap.registerPlugin(ScrambleTextPlugin);

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
      const target = props.trigger === 'group' ? props.host : rootRef.current;
      if (target === null) return;

      // contextSafe so the tween created in this listener is added to the scope
      // and reverted on cleanup.
      const decode = contextSafe(() => {
        if (reduced()) return;
        // revealDelay holds a short full scramble before decoding; low speed
        // keeps the glyph refresh chunky (digital) rather than a smooth blur;
        // tweenLength off since the text length never changes.
        gsap.to(fillRef.current, {
          duration: DURATION,
          ease: 'none',
          scrambleText: { text: children, chars: CHARS, speed: 0.5, revealDelay: 0.1, tweenLength: false },
        });
      });

      target.addEventListener('mouseenter', decode);
      return () => target.removeEventListener('mouseenter', decode);
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
