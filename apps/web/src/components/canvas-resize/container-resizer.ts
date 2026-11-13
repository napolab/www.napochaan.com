// Framework-free half of ./index (the React Resizer context), so custom elements can
// size a canvas without importing React.

export type CanvasSize = { width: number; height: number };

// A Resizer measures a canvas's CSS-px drawing size and notifies when it changes. The
// default measures the canvas's own box — i.e. the container it fills — which a
// ResizeObserver tracks through any layout change, including a viewport resize when
// that container is viewport-sized. So one default covers both the full-screen page
// background and a small contained demo cell: the caller's container decides the
// size, the canvas just fills it.
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
