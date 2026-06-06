export type Rect = { left: number; top: number; width: number; height: number };
export type Norm = { nx: number; ny: number };
export type Point = { x: number; y: number };

export const toNormalized = (rect: Rect, pageX: number, pageY: number): Norm => ({
  nx: (pageX - rect.left) / rect.width,
  ny: (pageY - rect.top) / rect.height,
});

export const fromNormalized = (rect: Rect, n: Norm): Point => ({
  x: rect.left + n.nx * rect.width,
  y: rect.top + n.ny * rect.height,
});
