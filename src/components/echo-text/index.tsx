'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { useGSAP } from '@gsap/react';

import * as styles from './styles.css';

gsap.registerPlugin(ScrambleTextPlugin);

const CHARS = '█▓▒░#%&@/\\<>0123456789';
const DURATION = 1.1;

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type Props = {
  children: string;
};

export const EchoText = ({ children }: Props) => {
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

  const { contextSafe } = useGSAP(decode, { scope: rootRef, dependencies: [children] });
  const handleEnter = contextSafe(decode);

  return (
    <span ref={rootRef} className={styles.root} role="img" aria-label={children} onMouseEnter={handleEnter}>
      <span aria-hidden className={styles.echoOut}>
        {children}
      </span>
      <span aria-hidden className={styles.echoBlue}>
        {children}
      </span>
      <span aria-hidden className={styles.fill}>
        <span ref={fillRef}>{children}</span>
        <span className={styles.red}>.</span>
      </span>
    </span>
  );
};
