import { prefersReducedMotion, subscribeReducedMotion } from '@utils/prefers-reduced-motion';

import { stepCursorRender, type CursorRender } from './step-cursor-render';

import type { Resizer } from '@components/canvas-resize/container-resizer';
import type { CursorColor } from '@lib/cursor/identity';
import type { VisitorPointerApp } from '@lib/cursor/visitor-pointer-app';
import type { Placement } from './placement';

// Framework-free core of the cursor canvas, shared by the React CursorLayer
// (./cursor-layer.tsx) and the <cursor-presence> element (./element.ts) /
// the colophon <cursor-presence-demo>, so the drawing never drifts.

const GLYPH = '✕';
const LERP = 0.25; // per-frame position follow factor toward the target
const ALPHA_LERP = 0.08; // per-frame opacity follow factor (≈0.5s fade at 60fps)
const IDLE_MS = 5000; // hide a cursor after it sits idle this long; fades back in on the next move
const MIN_ALPHA = 0.01; // below this a cursor is effectively invisible — skip drawing it
const GLYPH_FONT = '700 16px "config-mono-vf", monospace';
const LABEL_FONT = '11px "config-mono-vf", monospace';
const LABEL_PAD_X = 4;
const LABEL_HEIGHT = 15;
const LABEL_GAP = 16;

const drawCursor = (ctx: CanvasRenderingContext2D, color: string, label: string, x: number, y: number, alpha: number): void => {
  ctx.globalAlpha = alpha;
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
  ctx.globalAlpha = 1;
};

export type CursorLayerBinding = {
  canvas: HTMLCanvasElement;
  app: VisitorPointerApp;
  enabled: boolean;
  // Injected by the consumer so the layer stays agnostic of how a cursor color resolves.
  getColor: (color: CursorColor) => string;
  // Where a normalized point lands on the canvas (container / surface-anchored).
  placement: Placement;
  resizer: Resizer;
};

// One continuous rAF loop that re-lerps every remote cursor toward its target and
// draws it. Returns the teardown (loop, app subscription, resize observer, motion).
export const bindCursorLayer = ({ canvas, app, enabled, getColor, placement, resizer }: CursorLayerBinding): (() => void) => {
  const ctx = canvas.getContext('2d');
  if (ctx === null) return () => {};

  // All per-frame state: render positions (lerped on-screen px), the latest visitor
  // map (kept current via subscribe), the drawing surface's CSS-px size, the rAF
  // handle and the effective reduced-motion preference (OS + header toggle), tracked
  // live so a change takes effect on the next frame.
  const renders = new Map<string, CursorRender>();
  const live = { visitors: app.getState().visitors, raf: 0, reduceMotion: prefersReducedMotion() };
  const size = { width: 0, height: 0 };

  const offMotion = subscribeReducedMotion(() => {
    live.reduceMotion = prefersReducedMotion();
  });
  const unsubscribe = app.subscribe((state) => {
    live.visitors = state.visitors;
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

  const drawVisitors = (): void => {
    const now = performance.now();
    const current = live.visitors;
    for (const visitor of current.values()) {
      if (visitor.x === undefined || visitor.y === undefined) continue; // no position yet (just joined)
      const target = placement.place(visitor.x, visitor.y, size);
      if (target === null) continue;
      const next = stepCursorRender(
        { prev: renders.get(visitor.id), nx: visitor.x, ny: visitor.y, targetX: target.x, targetY: target.y, now },
        { lerp: LERP, alphaLerp: ALPHA_LERP, idleMs: IDLE_MS, reduceMotion: live.reduceMotion },
      );
      renders.set(visitor.id, next);
      if (next.alpha < MIN_ALPHA) continue; // idle long enough to be invisible — skip the draw
      drawCursor(ctx, getColor(visitor.color), visitor.label, next.x, next.y, next.alpha);
    }

    // Drop render entries for visitors that have left.
    for (const id of renders.keys()) {
      if (!current.has(id)) renders.delete(id);
    }
  };

  // The injected Placement maps each normalized point (and, for the page background,
  // re-anchors against page scroll — recomputed here every frame).
  const frame = (): void => {
    live.raf = requestAnimationFrame(frame);
    ctx.clearRect(0, 0, size.width, size.height);
    if (!enabled) return;
    drawVisitors();
  };
  live.raf = requestAnimationFrame(frame);

  return () => {
    unsubscribe();
    cancelAnimationFrame(live.raf);
    unobserve();
    offMotion();
  };
};
