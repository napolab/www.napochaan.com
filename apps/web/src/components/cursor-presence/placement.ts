import { fromNormalized, type Rect } from '@lib/cursor/coordinate';

import type { CanvasSize } from '@components/canvas-resize/container-resizer';

// Framework-free half of ./placement-context: maps a normalized visitor point to
// canvas-local px. Injected so the cursor layer stays agnostic of WHERE cursors are
// anchored: the default places them straight inside the canvas (the demo cell); the
// page background uses a surface-anchored placer that follows page scroll.
export type Placement = {
  place: (nx: number, ny: number, size: CanvasSize) => { x: number; y: number } | null;
};

// Default: the canvas IS the surface — normalized coords map straight onto its box.
export const containerPlacement: Placement = {
  place: (nx, ny, size) => ({ x: nx * size.width, y: ny * size.height }),
};

// Surface-anchored: cursors are normalized to a document-space surface rect while the
// canvas is viewport-fixed, so convert through the rect and subtract scroll.
export const createSurfacePlacement = (getRect: () => Rect | null): Placement => ({
  place: (nx, ny) => {
    const rect = getRect();
    if (rect === null) return null;
    const p = fromNormalized(rect, { nx, ny });

    return { x: p.x - window.scrollX, y: p.y - window.scrollY };
  },
});
