'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { useGSAP } from '@gsap/react';

import { useBootReady } from '@components/boot-status';

import * as styles from './styles.css';

gsap.registerPlugin(ScrambleTextPlugin);

const CHARS = '█▓▒░#%&@/\\<>0123456789';
const DURATION = 1.1;

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type Props = {
  children: string;
  // Visual scale. 'hero' is the full display wordmark (default); 'compact' is a
  // smaller h1-scale rendering with proportionally tighter echo offsets, for
  // places that can't host the full-bleed size (e.g. the colophon demo cell).
  size?: 'hero' | 'compact';
};

export const EchoText = ({ children, size = 'hero' }: Props) => {
  const rootRef = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);

  const decode = () => {
    if (reduced()) return;
    // revealDelay holds the full scramble before decoding; low speed keeps the
    // glyph refresh chunky (digital) rather than a 60fps blur; tweenLength off
    // since the word length never changes.
    gsap.to(fillRef.current, {
      duration: DURATION,
      ease: 'none',
      scrambleText: { text: children, chars: CHARS, speed: 0.45, revealDelay: 0.35, tweenLength: false },
    });
  };

  const bootReady = useBootReady();
  const { contextSafe } = useGSAP(
    () => {
      if (!bootReady) return;
      decode();
    },
    { scope: rootRef, dependencies: [children, bootReady] },
  );
  // pointerenter fires for every pointer type, so the wordmark re-decodes on a
  // mouse hover AND a touch tap — it's a playful flourish, not a link, so there
  // is no navigation to race. (ScrambleText, which wraps links, skips touch.)
  const handleEnter = contextSafe(decode);

  return (
    <span ref={rootRef} data-size={size} className={styles.root} role="img" aria-label={children} onPointerEnter={handleEnter}>
      <span aria-hidden data-size={size} className={styles.echoOut}>
        {children}
      </span>
      <span aria-hidden data-size={size} className={styles.echoBlue}>
        {children}
      </span>
      <span aria-hidden className={styles.fill}>
        <span ref={fillRef}>{children}</span>
        <span className={styles.red}>.</span>
      </span>
    </span>
  );
};
