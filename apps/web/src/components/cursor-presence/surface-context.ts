'use client';

import { createContext, useContext, type RefObject } from 'react';

// The cursor surface (`[data-cursor-surface]`) is rendered by callers (site-shell, showcase) as
// CursorPresence's children, so CursorPresence shares a ref through this context for the surface
// element to attach to — avoiding `document.querySelector` to locate it.
type SurfaceRef = RefObject<HTMLDivElement | null>;

const SurfaceRefContext = createContext<SurfaceRef | null>(null);

export const SurfaceRefProvider = SurfaceRefContext.Provider;

export const useSurfaceRef = (): SurfaceRef | null => useContext(SurfaceRefContext);
