import type { Rect } from '@lib/cursor/coordinate';

// Tracks the document-space rect of the cursor coordinate surface, shared by the React
// CursorPresence and the <cursor-presence> element. On the Astro site the stage is
// plain markup outside the cursor layer, and ClientRouter replaces it (with <body>) on
// every swap — including same-path swaps (refresh, query-only navigation) — so the
// surface is re-resolved after each swap. Returns the live rect reader + teardown.
const AFTER_SWAP_EVENT = 'astro:after-swap';

const readRect = (el: HTMLElement | null): Rect | null => {
  if (el === null) return null;
  const r = el.getBoundingClientRect();

  return { left: r.left + window.scrollX, top: r.top + window.scrollY, width: r.width, height: r.height };
};

export type SurfaceTracker = {
  getRect: () => Rect | null;
  dispose: () => void;
};

export const trackSurface = (resolve: () => HTMLElement | null): SurfaceTracker => {
  const surface: { el: HTMLElement | null; rect: Rect | null } = { el: null, rect: null };
  const update = (): void => {
    surface.rect = readRect(surface.el);
  };
  const observer = new ResizeObserver(update);
  const attach = (): void => {
    observer.disconnect();
    surface.el = resolve();
    if (surface.el !== null) observer.observe(surface.el);
    update();
  };
  attach();
  document.addEventListener(AFTER_SWAP_EVENT, attach);
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);

  return {
    getRect: () => surface.rect,
    dispose: () => {
      observer.disconnect();
      document.removeEventListener(AFTER_SWAP_EVENT, attach);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    },
  };
};
