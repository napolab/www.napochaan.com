// The cursor coordinate surface. Inside one React root (colophon showcase) it is the
// CursorSurface element attached through SurfaceRefProvider. On the site the stage
// wraps the page `<slot />`, so it is plain Astro markup outside the CursorPresence
// island and is found in the DOM. ClientRouter replaces <body> (and with it the
// stage) on every navigation, so callers re-resolve after each page load.
export const SURFACE_SELECTOR = '[data-cursor-surface]';

export const resolveSurface = (fromRef: HTMLElement | null): HTMLElement | null => fromRef ?? document.querySelector<HTMLElement>(SURFACE_SELECTOR);
