'use client';

import { useEffect, useRef, useState } from 'react';

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

export const GameOfLife = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engine = useLifeEngine();
  const isClient = useIsClient();
  const reduced = useRef(typeof window !== 'undefined' ? matchMedia('(prefers-reduced-motion: reduce)').matches : false);

  const [active, setActive] = useState(false);

  // Effect 1: Resize — sizes the canvas and calls engine.resize on window resize
  useEffect(() => {
    // USEEFFECT_JUSTIFICATION: Imperative canvas sizing + engine resize on window layout change
    if (!isClient) return;

    const canvas = canvasRef.current;
    if (canvas === null) return;

    const resize = () => {
      const ctx = canvas.getContext('2d', { alpha: true });
      if (ctx === null) return;

      const dpr = Math.min(devicePixelRatio ?? 1, 2);
      const w = innerWidth - 48;
      const h = innerHeight - 48;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cols = Math.ceil(w / CELL) + 1;
      const rows = Math.ceil(h / CELL) + 1;
      engine.resize(cols, rows);
      drawCells(ctx, engine.getState());
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });
    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [engine, isClient]);

  // Effect 2: Animation loop — rAF + 7fps time-accumulator, calls engine.tick + draw
  useEffect(() => {
    // USEEFFECT_JUSTIFICATION: Imperative rAF loop for canvas animation
    if (!isClient || !active || reduced.current) return;

    const canvas = canvasRef.current;
    if (canvas === null) return;

    const rafState: RafState = { raf: 0, last: 0, acc: 0 };

    const tick = (t: number) => {
      if (rafState.last === 0) rafState.last = t;
      rafState.acc += t - rafState.last;
      rafState.last = t;
      if (rafState.acc >= FRAME_INTERVAL) {
        rafState.acc %= FRAME_INTERVAL;
        const ctx = canvas.getContext('2d', { alpha: true });
        if (ctx !== null) {
          drawCells(ctx, engine.tick());
        }
      }
      rafState.raf = requestAnimationFrame(tick);
    };

    rafState.raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafState.raf);
    };
  }, [active, engine, isClient]);

  // Effect 3: Visibility — pause when tab is hidden
  useEffect(() => {
    // USEEFFECT_JUSTIFICATION: Required for document.visibilitychange imperative event subscription
    if (!isClient || reduced.current) return;

    const onVisibilityChange = () => {
      setActive(!document.hidden);
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isClient]);

  // Effect 4: IntersectionObserver — pause when off-screen, start when in view
  useEffect(() => {
    // USEEFFECT_JUSTIFICATION: Required for IntersectionObserver imperative API
    if (!isClient) return;

    const canvas = canvasRef.current;
    if (canvas === null) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry === undefined) return;
        if (!entry.isIntersecting) {
          setActive(false);
        } else if (!reduced.current) {
          setActive(true);
        }
      },
      { threshold: 0 },
    );

    observer.observe(canvas);
    return () => {
      observer.disconnect();
    };
  }, [isClient]);

  return <canvas data-testid="game-of-life" aria-hidden="true" className={styles.root} ref={canvasRef} />;
};
