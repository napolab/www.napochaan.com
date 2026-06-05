'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useRafLoop } from '@hooks/use-raf-loop';
import { useWindowResize } from '@hooks/use-window-resize';

import { createLifeEngine, type LifeEngine, type LifeState } from './engine';
import * as styles from './styles.css';

const CELL = 24;
const FPS = 7;

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

type EngineRef = {
  engine: LifeEngine | null;
};

export const GameOfLife = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<EngineRef>({ engine: null });

  const reduced = useRef(typeof window !== 'undefined' ? matchMedia('(prefers-reduced-motion: reduce)').matches : false);

  const [active, setActive] = useState(false);

  const resize = useCallback(() => {
    // USEEFFECT_JUSTIFICATION: imperative canvas sizing and engine create/resize on layout change
    const canvas = canvasRef.current;
    if (canvas === null) return;
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

    if (engineRef.current.engine === null) {
      engineRef.current.engine = createLifeEngine({ cols, rows });
    } else {
      engineRef.current.engine.resize(cols, rows);
    }

    const { engine } = engineRef.current;
    drawCells(ctx, engine.getState());
  }, []);

  const tick = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (ctx === null) return;
    const { engine } = engineRef.current;
    if (engine === null) return;
    drawCells(ctx, engine.tick());
  }, []);

  useWindowResize(resize);

  useRafLoop(tick, { fps: FPS, active });

  // Visibility change: pause when tab is hidden
  useEffect(() => {
    // USEEFFECT_JUSTIFICATION: Required for document.visibilitychange imperative event subscription
    if (reduced.current) return;

    const onVisibilityChange = () => {
      if (document.hidden) {
        setActive(false);
      } else {
        setActive(true);
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  // IntersectionObserver: pause when off-screen; start when in view
  useEffect(() => {
    // USEEFFECT_JUSTIFICATION: Required for IntersectionObserver imperative API
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
  }, []);

  return <canvas data-testid="game-of-life" aria-hidden="true" className={styles.root} ref={canvasRef} />;
};
