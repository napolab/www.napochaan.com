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

type Props = {
  children: string;
  className?: string;
  // 'self'  — scramble when this text is hovered (the text itself is the link).
  // 'group' — scramble when the nearest ancestor <a> is hovered (whole-card link),
  //           so hovering anywhere on a card decodes its title.
  trigger?: 'self' | 'group';
};

// Inline text that decodes through glitch glyphs on hover (a terminal/command-line
// reveal). Client Component — the scramble needs GSAP. The text is rendered as a
// width-reserving ghost plus an absolutely-overlaid animated copy, so the churning
// glyphs never reflow surrounding layout (see styles). `aria-label` pins the
// accessible name to the text so an ancestor link's name stays stable while the
// glyphs churn (and reduced-motion users just see the plain text).
export const ScrambleText = ({ children, className, trigger = 'self' }: Props) => {
  const rootRef = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    (_context, contextSafe) => {
      const root = rootRef.current;
      if (root === null) return;
      if (contextSafe === undefined) return;
      // For a whole-card link, listen on the nearest <a> so the card's hover
      // drives the title; otherwise listen on the text itself.
      const host = trigger === 'group' ? root.closest('a') : root;
      if (host === null) return;

      // contextSafe so the tween created in this listener (which runs after
      // useGSAP) is still added to the scope and reverted on cleanup.
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

      host.addEventListener('mouseenter', decode);
      return () => host.removeEventListener('mouseenter', decode);
    },
    { scope: rootRef, dependencies: [children, trigger] },
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
