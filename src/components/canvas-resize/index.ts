'use client';

import { createContext, useContext } from 'react';

export type CanvasSize = { width: number; height: number };

// A Resizer measures a canvas's CSS-px drawing size and notifies when it changes.
// Injected via context so the size source is swappable (a test mock, a viewport
// strategy, …). The default measures the canvas's own box — i.e. the container it
// fills — which a ResizeObserver tracks through any layout change, including a
// viewport resize when that container is viewport-sized. So one default covers both
// the full-screen page background and a small contained demo cell: the caller's
// container div decides the size, the component just fills it.
export type Resizer = {
  measure: (canvas: HTMLCanvasElement) => CanvasSize;
  observe: (canvas: HTMLCanvasElement, onResize: () => void) => () => void;
};

export const containerResizer: Resizer = {
  measure: (canvas) => ({ width: canvas.clientWidth, height: canvas.clientHeight }),
  observe: (canvas, onResize) => {
    const observer = new ResizeObserver(onResize);
    observer.observe(canvas);

    return () => {
      observer.disconnect();
    };
  },
};

const ResizerContext = createContext<Resizer>(containerResizer);

export const ResizerProvider = ResizerContext.Provider;

export const useResizer = (): Resizer => useContext(ResizerContext);
