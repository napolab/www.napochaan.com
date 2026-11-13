import { css } from '@styled/css';

// Brand-blue frame standing in for the full-viewport boot overlay (which is fixed
// and only shows while fonts load, so it can't be rendered inline). Centers the
// real BootConsole so the demo shows the brand line, the cycling typed prompt, and
// the progress bar exactly as they appear at boot.
export const frame = css({
  display: 'grid',
  placeItems: 'center',
  width: 'full',
  minHeight: '[144px]',
  padding: '8',
  bg: 'accent.solid',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.subtle',
});
