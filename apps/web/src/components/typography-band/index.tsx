'use client';

import { useEffect, useRef } from 'react';

import { usePrefersReducedMotion } from '@hooks/use-prefers-reduced-motion';
import { prefersReducedMotion } from '@utils/prefers-reduced-motion';

import { DEFAULT_TEXT, REPEAT_COUNT } from './band-text';
import { bindBand } from './bind-band';
import * as styles from './styles.css';

type Props = {
  text?: string;
};

export const TypographyBand = ({ text = DEFAULT_TEXT }: Props) => {
  const repeated = text.repeat(REPEAT_COUNT);

  const trackTopRef = useRef<HTMLDivElement>(null);
  const trackBottomRef = useRef<HTMLDivElement>(null);
  const trackLeftRef = useRef<HTMLDivElement>(null);
  const trackRightRef = useRef<HTMLDivElement>(null);

  // Effective reduced-motion (OS setting + the header motion toggle). Listed as a
  // dependency so the effect reverts and re-runs when it flips — replacing the old
  // gsap.matchMedia(OS-only) gate so the toggle can stop / resume the band too.
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    // USEEFFECT_JUSTIFICATION: imperative gsap ticker + ScrollTrigger driving a
    // rAF-style drift/snap loop on DOM refs (./bind-band, shared with the
    // <typography-band> element), loaded lazily (dynamic import) after mount.
    // The live preference too: a hydration commit runs this with the server snapshot.
    if (reduced || prefersReducedMotion()) return;
    const top = trackTopRef.current;
    const bottom = trackBottomRef.current;
    const left = trackLeftRef.current;
    const right = trackRightRef.current;
    if (!top || !bottom || !left || !right) return;

    return bindBand({ top, bottom, left, right });
  }, [reduced]);

  return (
    <>
      <div className={styles.bandTop} data-testid="typography-band" aria-hidden="true">
        <div ref={trackTopRef} className={styles.track}>
          <span>{repeated}</span>
          <span>{repeated}</span>
        </div>
      </div>
      <div className={styles.bandBottom} data-testid="typography-band" aria-hidden="true">
        <div ref={trackBottomRef} className={styles.track}>
          <span>{repeated}</span>
          <span>{repeated}</span>
        </div>
      </div>
      <div className={styles.bandLeft} data-testid="typography-band" aria-hidden="true">
        <div ref={trackLeftRef} className={styles.trackVertical}>
          <span>{repeated}</span>
          <span>{repeated}</span>
        </div>
      </div>
      <div className={styles.bandRight} data-testid="typography-band" aria-hidden="true">
        <div ref={trackRightRef} className={styles.trackVertical}>
          <span>{repeated}</span>
          <span>{repeated}</span>
        </div>
      </div>
    </>
  );
};
