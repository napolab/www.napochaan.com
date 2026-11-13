import { css } from '@styled/css';

// The canvas fills its container; the caller's box decides the size. All remote
// cursors are drawn onto it each frame.
export const canvas = css({
  display: 'block',
  width: 'full',
  height: 'full',
  pointerEvents: 'none',
});

// The page background's container: a full-viewport fixed overlay above content. The
// canvas fills it. (Contained demos supply their own cell box instead.)
export const overlay = css({
  position: 'fixed',
  top: '0',
  left: '0',
  width: '[100vw]',
  height: '[100vh]',
  pointerEvents: 'none',
  zIndex: 'overlay',
});
