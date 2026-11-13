'use client';

import { useEffect, useRef } from 'react';

import { useResizer } from '@components/canvas-resize';
import { useIsClient } from '@hooks/use-is-client';
import { usePrefersReducedMotion } from '@hooks/use-prefers-reduced-motion';

import { bindLifeCanvas, startLifeLoop } from './bind-life';
import { useLifeEngine } from './provider';
import * as styles from './styles.css';

// The React GameOfLife: the reference markup for shell-backdrop.astro / game-of-life.astro
// (the site and the colophon demo run the <game-of-life> element, ./element.ts, which
// shares ./bind-life with this component).
//
// The canvas always fills its container; the caller's box decides the size (the
// fixed full-screen frame for the page background, a cell for the colophon demo).
// How that size is measured / observed is injected via the Resizer context, so the
// component itself owns no viewport logic. For a contained instance, wrap it in its
// own LifeEngineProvider so it gets an isolated engine and never disturbs the
// background's generation count.
export const GameOfLife = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isClient = useIsClient();

  const engine = useLifeEngine();
  const resizer = useResizer();
  const reduced = usePrefersReducedMotion();

  // Effect 1: Resize — sizes the canvas and re-seeds the engine on layout change
  useEffect(() => {
    // USEEFFECT_JUSTIFICATION: Imperative canvas sizing + engine resize on layout change
    if (!isClient) return;
    const canvas = canvasRef.current;
    if (canvas === null) return;

    return bindLifeCanvas({ canvas, engine, resizer });
  }, [engine, isClient, resizer]);

  // Effect 2: Animation loop (rAF 7fps) + pause while the tab is hidden
  useEffect(() => {
    // USEEFFECT_JUSTIFICATION: Imperative rAF loop + visibilitychange subscription for canvas animation
    if (!isClient || reduced) return;
    const canvas = canvasRef.current;
    if (canvas === null) return;

    return startLifeLoop({ canvas, engine });
  }, [engine, isClient, reduced]);

  return <canvas data-testid="game-of-life" aria-hidden="true" className={styles.root} ref={canvasRef} />;
};
