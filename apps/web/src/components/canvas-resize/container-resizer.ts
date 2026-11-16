// Framework-free half of ./index (the React Resizer context), so custom elements can
// size a canvas without importing React.

export type CanvasSize = { width: number; height: number };

// A Resizer reports a canvas's CSS-px drawing size: once as soon as it is known, then
// on every change. The default observes the canvas's own box — i.e. the container it
// fills — which a ResizeObserver tracks through any layout change, including a
// viewport resize when that container is viewport-sized. So one default covers both
// the full-screen page background and a small contained demo cell: the caller's
// container decides the size, the canvas just fills it.
//
// There is deliberately no synchronous `measure`: reading clientWidth while binding
// (a custom element's connect, during page load) forced the whole document's first
// layout inside that script task. The ResizeObserver's initial entry arrives right
// after the next natural layout, before that frame paints, so nothing is lost.
export type Resizer = {
  observe: (canvas: HTMLCanvasElement, onResize: (size: CanvasSize) => void) => () => void;
};

// clientWidth / clientHeight are integers; keep the size the canvas used to get.
const sizeOf = (entry: ResizeObserverEntry): CanvasSize => ({ width: Math.round(entry.contentRect.width), height: Math.round(entry.contentRect.height) });

export const containerResizer: Resizer = {
  observe: (canvas, onResize) => {
    const observer = new ResizeObserver((entries) => {
      const entry = entries.at(-1);
      if (entry === undefined) return;
      onResize(sizeOf(entry));
    });
    observer.observe(canvas);

    return () => {
      observer.disconnect();
    };
  },
};
