'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

import { wrap } from './band-scroll';
import * as styles from './styles.css';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const DEFAULT_TEXT = 'NAPOCHAAN · DJ × VJ · GRAPHIC × DIGITAL · SINCE 2020 · ';
const REPEAT_COUNT = 20;
const VELOCITY_SCALE = 0.04;
const BASE_DRIFT = 0.35; // constant px-per-60fps-frame so the band always moves
const VEL_DECAY = 0.9; // scroll-velocity boost decays back to the base drift
const FRAME_MS = 1000 / 60;
const GRID = 24; // Game-of-Life cell size; snap scroll to its multiples on rest
const SNAP_DELAY = 140;

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

      // pos accumulates a constant drift plus a decaying scroll-velocity boost.
      // We render with gsap.set + wrap each frame (instant) so the duplicated
      // track loops seamlessly — no smoothing across the wrap boundary, so the
      // text never scrolls out and shows a blank gap before looping.
      const pos = { top: 0, bottom: 0, left: 0, right: 0 };
      const boost = { value: 0 };

      const trigger = ScrollTrigger.create({
        onUpdate: (self) => {
          boost.value = self.getVelocity() * VELOCITY_SCALE;
        },
      });

      const tick = (_time: number, deltaMs: number) => {
        const step = (BASE_DRIFT + boost.value) * (deltaMs / FRAME_MS);
        boost.value *= VEL_DECAY;
        // Clockwise rotation around the frame: top ← / right ↑ / bottom → / left ↓
        pos.top = wrap(pos.top - step, topHalf);
        pos.bottom = wrap(pos.bottom + step, topHalf);
        pos.left = wrap(pos.left + step, leftHalf);
        pos.right = wrap(pos.right - step, leftHalf);
        gsap.set(topTrack, { x: pos.top });
        gsap.set(bottomTrack, { x: pos.bottom });
        gsap.set(leftTrack, { y: pos.left });
        gsap.set(rightTrack, { y: pos.right });
      };
      gsap.ticker.add(tick);

      // Snap the page scroll to the Game-of-Life 24px grid once scrolling rests,
      // so the scrolling content grid lines up with the fixed living grid. The
      // snap is interruptible: any real user input (wheel/touch/key) kills an
      // in-flight snap and defers the next one, so it never fights the user.
      const snap = { timer: undefined as ReturnType<typeof setTimeout> | undefined, tween: undefined as gsap.core.Tween | undefined };

      const cancelSnap = () => {
        snap.tween?.kill();
        snap.tween = undefined;
        clearTimeout(snap.timer);
      };

      const onScroll = () => {
        clearTimeout(snap.timer);
        snap.timer = setTimeout(() => {
          const y = window.scrollY;
          const target = Math.round(y / GRID) * GRID;
          if (Math.abs(target - y) > 0.5) {
            snap.tween = gsap.to(window, {
              duration: 0.3,
              ease: 'power2.out',
              scrollTo: target,
              onComplete: () => {
                snap.tween = undefined;
              },
            });
          }
        }, SNAP_DELAY);
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('wheel', cancelSnap, { passive: true });
      window.addEventListener('touchstart', cancelSnap, { passive: true });
      window.addEventListener('keydown', cancelSnap);

      return () => {
        gsap.ticker.remove(tick);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('wheel', cancelSnap);
        window.removeEventListener('touchstart', cancelSnap);
        window.removeEventListener('keydown', cancelSnap);
        cancelSnap();
        trigger.kill();
      };
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
