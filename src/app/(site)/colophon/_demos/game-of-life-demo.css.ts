import { css } from '@styled/css';

// Sized box the contained GameOfLife fills. Opaque bg: the page's own full-screen
// Game of Life sits behind this cell, so a transparent surface would let the two
// grids overlap and blur into each other. An opaque bg isolates this instance.
export const frame = css({
  position: 'relative',
  width: 'full',
  height: '[144px]',
  overflow: 'hidden',
  bg: 'bg.canvas',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.subtle',
});
