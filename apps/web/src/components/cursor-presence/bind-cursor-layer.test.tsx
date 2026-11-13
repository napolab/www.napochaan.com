import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { containerResizer } from '@components/canvas-resize/container-resizer';

import { bindCursorLayer } from './bind-cursor-layer';
import { containerPlacement } from './placement';

import type { Visitor, VisitorPointerApp, VisitorPointerState } from '@lib/cursor/visitor-pointer-app';

// Framework-free core of the cursor canvas, shared by the React CursorLayer and the
// <cursor-presence> element: one rAF loop drawing every positioned visitor.
const stubApp = (visitors: Visitor[]) => {
  const listeners = new Set<(state: VisitorPointerState) => void>();
  const state: VisitorPointerState = { visitors: new Map(visitors.map((visitor) => [visitor.id, visitor])), count: visitors.length };
  const app: VisitorPointerApp = {
    start: () => {},
    end: () => {},
    setChannel: () => {},
    send: () => {},
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  return { app, listeners };
};

const visitor: Visitor = { id: 'a', color: 'blue', label: 'napochaan', x: 0.25, y: 0.25 };

const mountCanvas = () => {
  const box = document.createElement('div');
  box.style.cssText = 'width: 200px; height: 100px;';
  box.innerHTML = '<canvas style="display: block; width: 100%; height: 100%;"></canvas>';
  document.body.appendChild(box);
  const canvas = box.querySelector('canvas');
  if (canvas === null) throw new Error('not rendered');
  return canvas;
};

const inked = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d');
  if (ctx === null) throw new Error('no 2d context');
  return ctx.getImageData(0, 0, canvas.width, canvas.height).data.some((value) => value !== 0);
};

const bind = (canvas: HTMLCanvasElement, app: VisitorPointerApp, enabled = true) =>
  bindCursorLayer({ canvas, app, enabled, getColor: () => '#1a34ff', placement: containerPlacement, resizer: containerResizer });

describe('bindCursorLayer', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('draws positioned visitors every frame', () => {
    const canvas = mountCanvas();
    const dispose = bind(canvas, stubApp([visitor]).app);

    vi.advanceTimersByTime(32);
    expect(inked(canvas)).toBe(true);
    dispose();
  });

  it('draws nothing while disabled', () => {
    const canvas = mountCanvas();
    const dispose = bind(canvas, stubApp([visitor]).app, false);

    vi.advanceTimersByTime(32);
    expect(inked(canvas)).toBe(false);
    dispose();
  });

  it('stops its loop and its subscription when disposed', () => {
    const canvas = mountCanvas();
    const { app, listeners } = stubApp([visitor]);
    const dispose = bind(canvas, app);
    expect(listeners.size).toBe(1);

    dispose();
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    vi.advanceTimersByTime(64);
    expect(inked(canvas)).toBe(false);
    expect(listeners.size).toBe(0);
  });
});
