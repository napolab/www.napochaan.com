export type Rect = { left: number; top: number; width: number; height: number };
export type Norm = { nx: number; ny: number };
export type Point = { x: number; y: number };

// Pointer page coords -> normalized (nx, ny) in [0, 1] relative to the cursor-surface box. Shared
// over the wire so each viewer maps into its own surface, which may differ in size.
export const toNormalized = (rect: Rect, pageX: number, pageY: number): Norm => ({
  nx: (pageX - rect.left) / rect.width,
  ny: (pageY - rect.top) / rect.height,
});

// Normalized (nx, ny) -> document-space point within this viewer's surface (inverse of toNormalized).
export const fromNormalized = (rect: Rect, n: Norm): Point => ({
  x: rect.left + n.nx * rect.width,
  y: rect.top + n.ny * rect.height,
});
