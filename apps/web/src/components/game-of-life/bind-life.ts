import type { Resizer } from '@components/canvas-resize/container-resizer';
import type { LifeEngine, LifeState } from './engine';

// Framework-free core of the GameOfLife canvas, shared by the React GameOfLife
// (./index.tsx — the reference markup and colophon tests) and the <game-of-life>
// custom element (./element.ts), so the two never drift.

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

const contextOf = (canvas: HTMLCanvasElement) => canvas.getContext('2d', { alpha: true });

type CanvasBinding = {
  canvas: HTMLCanvasElement;
  engine: LifeEngine;
  resizer: Resizer;
};

// Sizes the canvas to the box it fills and keeps the engine's grid in step with it,
// observing later layout changes. The engine is re-seeded only when the grid actually
// changes: resize() zeroes the generation the SysBar shows, and a ResizeObserver can
// report an unchanged box (a transition:persist move detaches and re-attaches the
// canvas). Returns the unobserve.
export const bindLifeCanvas = ({ canvas, engine, resizer }: CanvasBinding): (() => void) => {
  const resize = () => {
    const ctx = contextOf(canvas);
    if (ctx === null) return;

    const dpr = Math.min(devicePixelRatio ?? 1, 2);
    const { width, height } = resizer.measure(canvas);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cols = Math.ceil(width / CELL) + 1;
    const rows = Math.ceil(height / CELL) + 1;
    const current = engine.getState();
    if (current.cols !== cols || current.rows !== rows) engine.resize(cols, rows);
    drawCells(ctx, engine.getState());
  };

  resize();
  return resizer.observe(canvas, resize);
};

type LoopBinding = {
  canvas: HTMLCanvasElement;
  engine: LifeEngine;
};

// The animation loop: ticks the engine at 7fps on rAF and pauses while the tab is
// hidden. Returns the stop.
export const startLifeLoop = ({ canvas, engine }: LoopBinding): (() => void) => {
  const state = { raf: 0, last: 0, acc: 0 };

  const tick = (t: number) => {
    if (state.last === 0) state.last = t;
    state.acc += t - state.last;
    state.last = t;
    if (state.acc >= FRAME_INTERVAL) {
      state.acc %= FRAME_INTERVAL;
      const ctx = contextOf(canvas);
      if (ctx !== null) drawCells(ctx, engine.tick());
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
};
