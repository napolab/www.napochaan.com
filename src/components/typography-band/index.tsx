'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

import { wrap } from './band-scroll';
import * as styles from './styles.css';

gsap.registerPlugin(ScrollTrigger);

const DEFAULT_TEXT = 'NAPOCHAAN · DJ × VJ · GRAPHIC × DIGITAL · SINCE 2020 · ';
const REPEAT_COUNT = 20;
const VELOCITY_SCALE = 0.04;

type Props = {
  text?: string;
};

export const TypographyBand = ({ text = DEFAULT_TEXT }: Props) => {
  const repeated = text.repeat(REPEAT_COUNT);

  const trackTopRef = useRef<HTMLDivElement>(null);
  const trackBottomRef = useRef<HTMLDivElement>(null);
  const trackLeftRef = useRef<HTMLDivElement>(null);
  const trackRightRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const topTrack = trackTopRef.current;
    const bottomTrack = trackBottomRef.current;
    const leftTrack = trackLeftRef.current;
    const rightTrack = trackRightRef.current;

    if (!topTrack || !bottomTrack || !leftTrack || !rightTrack) return;

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const topHalf = topTrack.scrollWidth / 2;
      const leftHalf = leftTrack.scrollHeight / 2;

      const moveTop = gsap.quickTo(topTrack, 'x', { duration: 0.6, ease: 'power2.out' });
      const moveBottom = gsap.quickTo(bottomTrack, 'x', { duration: 0.6, ease: 'power2.out' });
      const moveLeft = gsap.quickTo(leftTrack, 'y', { duration: 0.6, ease: 'power2.out' });
      const moveRight = gsap.quickTo(rightTrack, 'y', { duration: 0.6, ease: 'power2.out' });

      const pos = { top: 0, bottom: 0, left: 0, right: 0 };

      ScrollTrigger.create({
        onUpdate: (self) => {
          const delta = self.getVelocity() * VELOCITY_SCALE;

          // Clockwise rotation around the frame: top ← / right ↑ / bottom → / left ↓
          pos.top = wrap(pos.top - delta, topHalf);
          pos.bottom = wrap(pos.bottom + delta, topHalf);
          pos.left = wrap(pos.left + delta, leftHalf);
          pos.right = wrap(pos.right - delta, leftHalf);

          moveTop(pos.top);
          moveBottom(pos.bottom);
          moveLeft(pos.left);
          moveRight(pos.right);
        },
      });
    });
  });

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
