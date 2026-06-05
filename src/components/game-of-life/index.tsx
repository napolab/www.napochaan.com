'use client';

import { useEffect, useRef } from 'react';

import { createGrid, seedRandom, step, countAlive } from './life';
import * as styles from './styles.css';

type LoopState = {
  raf: number;
  last: number;
  acc: number;
  grid: ReturnType<typeof createGrid>;
};

const CELL = 24;
const FRAME_INTERVAL = 1000 / 7;
const SEED_DENSITY = 0.16;

export const GameOfLife = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // USEEFFECT_JUSTIFICATION: Required for imperative canvas 2D drawing and rAF loop
    const canvas = canvasRef.current;
    if (canvas === null) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (ctx === null) return;

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const state: LoopState = {
      raf: 0,
      last: 0,
      acc: 0,
      grid: createGrid(1, 1),
    };

    const resize = () => {
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
      state.grid = seedRandom(createGrid(cols, rows), SEED_DENSITY, Math.random);
      state.last = 0;
      state.acc = 0;
    };

    const draw = () => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      const { cols, cells } = state.grid;
      for (const i of cells.keys()) {
        if (cells[i] !== 1) continue;
        const cx = i % cols;
        const cy = Math.floor(i / cols);
        const red = (cx * 31 + cy * 17) % 23 === 0;
        ctx.fillStyle = red ? 'rgba(255,0,43,0.10)' : 'rgba(26,52,255,0.11)';
        ctx.fillRect(cx * CELL + 1, cy * CELL + 1, CELL - 2, CELL - 2);
      }
    };

    const advance = () => {
      state.grid = step(state.grid);
      const alive = countAlive(state.grid);
      if (alive < state.grid.cols * state.grid.rows * 0.02) {
        state.grid = seedRandom(state.grid, SEED_DENSITY, Math.random);
      }
    };

    const loop = (t: number) => {
      if (state.last === 0) state.last = t;
      state.acc += t - state.last;
      state.last = t;
      if (state.acc >= FRAME_INTERVAL) {
        state.acc %= FRAME_INTERVAL;
        advance();
        draw();
      }
      state.raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (state.raf !== 0) return;
      state.last = 0;
      state.raf = requestAnimationFrame(loop);
    };

    const stop = () => {
      cancelAnimationFrame(state.raf);
      state.raf = 0;
    };

    resize();
    draw();

    if (!reduced) {
      start();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry === undefined) return;
        if (entry.isIntersecting) {
          if (!reduced) start();
        } else {
          stop();
        }
      },
      { threshold: 0 },
    );
    observer.observe(canvas);

    const onVisibilityChange = () => {
      if (document.hidden) {
        stop();
      } else if (!reduced) {
        start();
      }
    };

    const onResize = () => {
      stop();
      resize();
      draw();
      if (!reduced) start();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(state.raf);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      removeEventListener('resize', onResize);
      observer.disconnect();
    };
  }, []);

  return <canvas data-testid="game-of-life" aria-hidden="true" className={styles.root} ref={canvasRef} />;
};
