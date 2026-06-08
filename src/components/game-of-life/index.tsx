'use client';

import { useEffect, useMemo, useRef } from 'react';

import { useResizer } from '@components/canvas-resize';
import { useIsClient } from '@hooks/use-is-client';
import { useLifeEngine } from './provider';

import type { LifeState } from './engine';
import * as styles from './styles.css';

const CELL = 24;
const FPS = 7;
const FRAME_INTERVAL = 1000 / FPS;

const drawCells = (ctx: CanvasRenderingContext2D, state: LifeState) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const { cols, cells } = state;
  for (const i of cells.keys()) {
    if (cells[i] !== 1) continue;
    const cx = i % cols;
    const cy = Math.floor(i / cols);
    const red = (cx * 31 + cy * 17) % 23 === 0;
    ctx.fillStyle = red ? 'rgba(255,0,43,0.10)' : 'rgba(26,52,255,0.11)';
    ctx.fillRect(cx * CELL + 1, cy * CELL + 1, CELL - 2, CELL - 2);
  }
};

type RafState = {
  raf: number;
  last: number;
  acc: number;
};

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
  const reduced = useMemo(() => (isClient ? matchMedia('(prefers-reduced-motion: reduce)').matches : false), [isClient]);

  // Effect 1: Resize — sizes the canvas and re-seeds the engine on layout change
  useEffect(() => {
    // USEEFFECT_JUSTIFICATION: Imperative canvas sizing + engine resize on layout change
    if (!isClient) return;

    const canvas = canvasRef.current;
    if (canvas === null) return;

    const resize = () => {
      const ctx = canvas.getContext('2d', { alpha: true });
      if (ctx === null) return;

      const dpr = Math.min(devicePixelRatio ?? 1, 2);
      const { width, height } = resizer.measure(canvas);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cols = Math.ceil(width / CELL) + 1;
      const rows = Math.ceil(height / CELL) + 1;
      engine.resize(cols, rows);
      drawCells(ctx, engine.getState());
    };

    resize();
    return resizer.observe(canvas, resize);
  }, [engine, isClient, resizer]);

  // Effect 2: Animation loop (rAF 7fps) + pause while the tab is hidden
  useEffect(() => {
    // USEEFFECT_JUSTIFICATION: Imperative rAF loop + visibilitychange subscription for canvas animation
    if (!isClient || reduced) return;

    const canvas = canvasRef.current;
    if (canvas === null) return;

    const state: RafState = { raf: 0, last: 0, acc: 0 };

    const tick = (t: number) => {
      if (state.last === 0) state.last = t;
      state.acc += t - state.last;
      state.last = t;
      if (state.acc >= FRAME_INTERVAL) {
        state.acc %= FRAME_INTERVAL;
        const ctx = canvas.getContext('2d', { alpha: true });
        if (ctx !== null) {
          drawCells(ctx, engine.tick());
        }
      }
      state.raf = requestAnimationFrame(tick);
    };

    const start = () => {
      state.last = 0;
      state.raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(state.raf);
    };
    const onVisibilityChange = () => {
      const fn = document.hidden ? stop : start;
      fn();
    };

    start();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [engine, isClient, reduced]);

  return <canvas data-testid="game-of-life" aria-hidden="true" className={styles.root} ref={canvasRef} />;
};
