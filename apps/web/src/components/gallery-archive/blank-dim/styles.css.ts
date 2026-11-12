import { css } from '@styled/css';

// A reference number + the cell's measured pixel size, centered like a dimension
// callout. Absolutely positioned and aria-hidden, so filling in the measured text
// after mount never shifts anything.
export const blankDim = css({
  position: 'absolute',
  inset: '0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  whiteSpace: 'pre-line',
  textAlign: 'center',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: '[11px]',
  letterSpacing: 'wide',
  lineHeight: '[1.45]',
  color: 'fg.muted',
  userSelect: 'none',
  pointerEvents: 'none',
});
