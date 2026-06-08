'use client';

import { useEffect, useRef } from 'react';

import { useResizer } from '@components/canvas-resize';

import { usePlacement } from './placement-context';
import * as styles from './styles.css';

import type { CursorColor } from '@lib/cursor/identity';
import type { VisitorPointerApp } from '@lib/cursor/visitor-pointer-app';

// Per-cursor render state in screen px. `render*` is the interpolated on-screen position (canvas has
// no CSS transition, so we lerp it each frame). `seeded` flips true after the first placement.
type Render = { x: number; y: number; seeded: boolean };

type Props = {
  app: VisitorPointerApp;
  enabled: boolean;
  // Injected by the consumer so this layer stays agnostic of how a cursor color resolves.
  getColor: (color: CursorColor) => string;
};

const GLYPH = '✕';
const LERP = 0.25; // per-frame follow factor toward the target
const GLYPH_FONT = '700 16px "config-mono-vf", monospace';
const LABEL_FONT = '11px "config-mono-vf", monospace';
const LABEL_PAD_X = 4;
const LABEL_HEIGHT = 15;
const LABEL_GAP = 16;

const drawCursor = (ctx: CanvasRenderingContext2D, color: string, label: string, x: number, y: number): void => {
  ctx.textBaseline = 'top';

  ctx.font = GLYPH_FONT;
  ctx.fillStyle = color;
  ctx.fillText(GLYPH, x, y);

  ctx.font = LABEL_FONT;
  const width = ctx.measureText(label).width + LABEL_PAD_X * 2;
  const labelX = x + LABEL_GAP;
  ctx.fillStyle = color;
  ctx.fillRect(labelX, y, width, LABEL_HEIGHT);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, labelX + LABEL_PAD_X, y + 2);
};

export const CursorLayer = ({ app, enabled, getColor }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resizer = useResizer();
  const placement = usePlacement();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const ctx = canvas.getContext('2d');
    if (ctx === null) return;

    // All per-frame state lives in this effect: render positions (lerped on-screen px), the latest
    // visitor map (kept current via subscribe), the drawing surface's CSS-px size, and the rAF handle.
    const renders = new Map<string, Render>();
    let visitors = app.getState().visitors;
    let rafId = 0;
    const size = { width: 0, height: 0 };

    // Track prefers-reduced-motion live so an OS setting change takes effect without a remount.
    const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
    let reduceMotion = motionQuery.matches;
    const onMotionChange = (): void => {
      reduceMotion = motionQuery.matches;
    };
    motionQuery.addEventListener('change', onMotionChange);

    const unsub = app.subscribe((s) => {
      visitors = s.visitors;
    });

    // The canvas fills its container; the injected Resizer measures + observes the box.
    const resize = (): void => {
      const dpr = window.devicePixelRatio;
      const measured = resizer.measure(canvas);
      size.width = measured.width;
      size.height = measured.height;
      canvas.width = size.width * dpr;
      canvas.height = size.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const unobserve = resizer.observe(canvas, resize);

    // One continuous rAF loop: re-lerps cursors toward their targets every frame. The
    // injected Placement maps each normalized point (and, for the page background,
    // re-anchors against page scroll — recomputed here every frame).
    const frame = (): void => {
      rafId = requestAnimationFrame(frame);
      ctx.clearRect(0, 0, size.width, size.height);
      if (!enabled) return;

      const current = visitors;
      for (const visitor of current.values()) {
        if (visitor.x === undefined || visitor.y === undefined) continue; // no position yet (just joined)
        const target = placement.place(visitor.x, visitor.y, size);
        if (target === null) continue;
        const prev = renders.get(visitor.id);
        const next: Render =
          prev === undefined || reduceMotion || !prev.seeded
            ? { x: target.x, y: target.y, seeded: true }
            : { x: prev.x + (target.x - prev.x) * LERP, y: prev.y + (target.y - prev.y) * LERP, seeded: true };
        renders.set(visitor.id, next);
        drawCursor(ctx, getColor(visitor.color), visitor.label, next.x, next.y);
      }

      // Drop render entries for visitors that have left.
      for (const id of renders.keys()) {
        if (!current.has(id)) renders.delete(id);
      }
    };
    rafId = requestAnimationFrame(frame);

    return () => {
      unsub();
      cancelAnimationFrame(rafId);
      unobserve();
      motionQuery.removeEventListener('change', onMotionChange);
    };
  }, [app, enabled, getColor, resizer, placement]);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
};
