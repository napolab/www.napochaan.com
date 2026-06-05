'use client';

import { useEffect, useRef } from 'react';

import { wrap } from './band-scroll';
import * as styles from './styles.css';

const DEFAULT_TEXT = 'NAPOCHAAN · DJ × VJ · GRAPHIC × DIGITAL · SINCE 2020 · 静かなインターネット · ';
const REPEAT_COUNT = 20;

type BandState = {
  raf: number;
  speed: number;
  lastY: number;
  posTop: number;
  posBottom: number;
  posLeft: number;
  posRight: number;
};

type Props = {
  text?: string;
};

export const TypographyBand = ({ text = DEFAULT_TEXT }: Props) => {
  const repeated = text.repeat(REPEAT_COUNT);

  const trackTopRef = useRef<HTMLDivElement>(null);
  const trackBottomRef = useRef<HTMLDivElement>(null);
  const trackLeftRef = useRef<HTMLDivElement>(null);
  const trackRightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // USEEFFECT_JUSTIFICATION: Required for imperative rAF scroll-reactive animation loop
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const trackTop = trackTopRef.current;
    const trackBottom = trackBottomRef.current;
    const trackLeft = trackLeftRef.current;
    const trackRight = trackRightRef.current;

    if (trackTop === null || trackBottom === null || trackLeft === null || trackRight === null) return;

    const state: BandState = {
      raf: 0,
      speed: 0,
      lastY: scrollY,
      posTop: 0,
      posBottom: 0,
      posLeft: 0,
      posRight: 0,
    };

    const onScroll = () => {
      state.speed += scrollY - state.lastY;
      state.lastY = scrollY;
    };

    const frame = () => {
      const halfH = trackTop.scrollWidth / 2;
      const halfV = trackLeft.scrollHeight / 2;
      const delta = state.speed * 0.6 + 0.25;

      state.posTop = wrap(state.posTop + delta, halfH);
      state.posBottom = wrap(state.posBottom - delta, halfH);
      state.posLeft = wrap(state.posLeft + delta, halfV);
      state.posRight = wrap(state.posRight - delta, halfV);

      trackTop.style.transform = `translateX(${state.posTop}px)`;
      trackBottom.style.transform = `translateX(${state.posBottom}px)`;
      trackLeft.style.transform = `translateY(${state.posLeft}px)`;
      trackRight.style.transform = `translateY(${state.posRight}px)`;

      state.speed *= 0.88;
      state.raf = requestAnimationFrame(frame);
    };

    addEventListener('scroll', onScroll, { passive: true });
    state.raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(state.raf);
      removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <>
      <div className={styles.bandTop} data-testid="typography-band" aria-hidden="true">
        <div className={styles.track} ref={trackTopRef}>
          <span>{repeated}</span>
          <span>{repeated}</span>
        </div>
      </div>
      <div className={styles.bandBottom} data-testid="typography-band" aria-hidden="true">
        <div className={styles.track} ref={trackBottomRef}>
          <span>{repeated}</span>
          <span>{repeated}</span>
        </div>
      </div>
      <div className={styles.bandLeft} data-testid="typography-band" aria-hidden="true">
        <div className={styles.trackVertical} ref={trackLeftRef}>
          <span>{repeated}</span>
          <span>{repeated}</span>
        </div>
      </div>
      <div className={styles.bandRight} data-testid="typography-band" aria-hidden="true">
        <div className={styles.trackVertical} ref={trackRightRef}>
          <span>{repeated}</span>
          <span>{repeated}</span>
        </div>
      </div>
    </>
  );
};
