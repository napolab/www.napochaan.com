'use client';

import { createContext, useContext } from 'react';

import { fromNormalized, type Rect } from '@lib/cursor/coordinate';

import type { CanvasSize } from '@components/canvas-resize';

// Maps a normalized visitor point to canvas-local px. Injected so CursorLayer stays
// agnostic of WHERE cursors are anchored: the default places them straight inside the
// canvas (the demo cell); the page background injects a surface-anchored placer that
// follows page scroll.
export type Placement = {
  place: (nx: number, ny: number, size: CanvasSize) => { x: number; y: number } | null;
};

// Default: the canvas IS the surface — normalized coords map straight onto its box.
export const containerPlacement: Placement = {
  place: (nx, ny, size) => ({ x: nx * size.width, y: ny * size.height }),
};

// Surface-anchored: cursors are normalized to a document-space surface rect while the
// canvas is viewport-fixed, so convert through the rect and subtract scroll. Built
// from the consumer's surface ref and injected for the page background.
export const createSurfacePlacement = (getRect: () => Rect | null): Placement => ({
  place: (nx, ny) => {
    const rect = getRect();
    if (rect === null) return null;
    const p = fromNormalized(rect, { nx, ny });

    return { x: p.x - window.scrollX, y: p.y - window.scrollY };
  },
});

const PlacementContext = createContext<Placement>(containerPlacement);

export const PlacementProvider = PlacementContext.Provider;

export const usePlacement = (): Placement => useContext(PlacementContext);
