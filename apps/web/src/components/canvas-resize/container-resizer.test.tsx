import { afterEach, describe, expect, it, vi } from 'vitest';

import { containerResizer } from './container-resizer';

import type { CanvasSize } from './container-resizer';

const mountCanvas = (width: number, height: number) => {
  const box = document.createElement('div');
  box.style.cssText = `width: ${width}px; height: ${height}px;`;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display: block; width: 100%; height: 100%;';
  box.appendChild(canvas);
  document.body.appendChild(box);
  return { box, canvas };
};

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe('containerResizer', () => {
  // Reading clientWidth at bind forced a layout inside the element's connect task;
  // the first ResizeObserver entry arrives right after the next layout instead.
  it('sizes from the first observation without reading layout synchronously', async () => {
    const { canvas } = mountCanvas(200, 100);
    const clientWidth = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get');
    const sizes: CanvasSize[] = [];

    const unobserve = containerResizer.observe(canvas, (size) => sizes.push(size));
    expect(clientWidth).not.toHaveBeenCalled();

    await expect.poll(() => sizes).toEqual([{ width: 200, height: 100 }]);
    unobserve();
  });

  it('reports later box changes and stops once unobserved', async () => {
    const { box, canvas } = mountCanvas(200, 100);
    const sizes: CanvasSize[] = [];
    const unobserve = containerResizer.observe(canvas, (size) => sizes.push(size));
    await expect.poll(() => sizes.length).toBe(1);

    box.style.width = '320px';
    await expect.poll(() => sizes.at(-1)).toEqual({ width: 320, height: 100 });

    unobserve();
    const seen = sizes.length;
    box.style.width = '100px';
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(sizes).toHaveLength(seen);
  });
});
