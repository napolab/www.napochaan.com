import { css } from '@styled/css';

// The canvas fills its container; the caller's box (a fixed full-screen frame for the
// page background, a cell for the demo) decides the size.
export const root = css({
  display: 'block',
  width: 'full',
  height: 'full',
  pointerEvents: 'none',
});
