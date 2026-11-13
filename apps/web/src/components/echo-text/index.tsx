'use client';

import { useEffect, useRef } from 'react';

import { useBootReady } from '@components/boot-status';
import { usePrefersReducedMotion } from '@hooks/use-prefers-reduced-motion';
import { prefersReducedMotion } from '@utils/prefers-reduced-motion';

import { bindEcho } from './bind-echo';
import * as styles from './styles.css';

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
  const bootReady = useBootReady();
  // Effective reduced-motion (OS setting + the header motion toggle). Checked BEFORE
  // bindEcho() so the gsap chunk is never imported at all for a reduced-motion
  // visitor — not merely no-op'd after loading.
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    // USEEFFECT_JUSTIFICATION: imperative gsap decode + hover listener on the root DOM
    // node (./bind-echo, shared with the <echo-text> element), loaded lazily after
    // mount and only once the boot overlay has lifted.
    // The live preference too: a hydration commit runs this with the server snapshot.
    if (!bootReady || reduced || prefersReducedMotion()) return;
    const root = rootRef.current;
    const fill = fillRef.current;
    if (root === null || fill === null) return;

    return bindEcho({ root, fill, text: children });
  }, [bootReady, reduced, children]);

  return (
    <span ref={rootRef} data-size={size} className={styles.root} role="img" aria-label={children}>
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
