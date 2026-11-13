import { css } from '@styled/css';

// The canvas fills its container; the caller's box (a fixed full-screen frame for the
// page background, a cell for the demo) decides the size.
export const root = css({
  display: 'block',
  width: 'full',
  height: 'full',
  pointerEvents: 'none',
});

// The <game-of-life> custom element (game-of-life.astro) is a pure wrapper: no box, so
// the canvas fills the caller's box exactly as the React GameOfLife did. A class so it
// applies before the element upgrades.
export const element = css({ display: 'contents' });
