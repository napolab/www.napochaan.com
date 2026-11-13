import { css } from '@styled/css';

// Sized box the contained CursorLayer fills. Opaque bg so the cursors read against a
// clean surface (and the page chrome never bleeds through).
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
