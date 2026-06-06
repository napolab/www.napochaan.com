'use client';

import { useCallback, useEffect, useRef } from 'react';

import * as styles from './styles.css';

const GLYPHS = '█▓▒░#%&@/\\<>0123456789';
const FRAME_MS = 45;

const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type Props = {
  children: string;
};

export const EchoText = ({ children }: Props) => {
  const fillRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const scramble = useCallback(() => {
    const node = fillRef.current;
    if (node === null) return;
    if (timerRef.current !== undefined) clearInterval(timerRef.current);
    if (prefersReducedMotion()) {
      node.textContent = children;
      return;
    }
    // Decode-from-noise: reveal each glyph left→right, randomising the rest.
    const settle = (frame: number) => frame / 2 > children.length;
    let frame = 0;
    timerRef.current = setInterval(() => {
      node.textContent = children
        .split('')
        .map((char, index) => (frame / 2 > index ? char : randomGlyph()))
        .join('');
      frame += 1;
      if (settle(frame)) {
        clearInterval(timerRef.current);
        node.textContent = children;
      }
    }, FRAME_MS);
  }, [children]);

  useEffect(() => {
    // USEEFFECT_JUSTIFICATION: imperative text-scramble animation on mount.
    // Writes directly to the DOM node via ref and clears its interval on unmount.
    scramble();
    return () => {
      if (timerRef.current !== undefined) clearInterval(timerRef.current);
    };
  }, [scramble]);

  return (
    <span className={styles.root} role="img" aria-label={children} onMouseEnter={scramble}>
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
