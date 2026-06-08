import { css } from '@styled/css';

// Single full-viewport overlay canvas; all remote cursors are drawn onto it each frame.
export const canvas = css({
  position: 'fixed',
  top: '0',
  left: '0',
  width: '[100vw]',
  height: '[100vh]',
  pointerEvents: 'none',
  zIndex: 'overlay',
});
