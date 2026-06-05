import { css } from '@styled/css';

export const root = css({
  listStyle: 'none',
  display: 'grid',
  gridTemplateColumns: 'repeat(6, 1fr)',
  gridAutoRows: '[78px]',
  gridAutoFlow: 'dense',
  gap: '[2px]',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'fg.default',
});

export const cell = css({
  overflow: 'hidden',
  '&[data-span="square"]': {
    gridColumn: 'span 1',
    gridRow: 'span 1',
  },
  '&[data-span="portrait"]': {
    gridColumn: 'span 2',
    gridRow: 'span 3',
  },
  '&[data-span="wide"]': {
    gridColumn: 'span 3',
    gridRow: 'span 2',
  },
  '&[data-span="tall"]': {
    gridColumn: 'span 2',
    gridRow: 'span 3',
  },
});

export const gridImage = css({
  width: 'full',
  height: 'full',
  objectFit: 'cover',
});

export const trigger = css({
  display: 'block',
  width: 'full',
  height: 'full',
  cursor: 'pointer',
  border: 'none',
  bg: 'transparent',
  p: '0',
  position: 'relative',
  overflow: 'hidden',
  _focusVisible: {
    layerStyle: 'focusRing',
  },
  _hover: {
    opacity: '[0.85]',
  },
});

export const modal = css({
  position: 'fixed',
  inset: '0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  bg: '[oklch(0 0 0 / 0.8)]',
  zIndex: 'modal',
});

export const dialog = css({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4',
  outline: 'none',
  maxW: '[90vw]',
  maxH: '[90vh]',
});

export const close = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  color: 'fg.onSolid',
  bg: 'transparent',
  border: 'none',
  cursor: 'pointer',
  letterSpacing: 'wide',
  textTransform: 'uppercase',
  _focusVisible: {
    layerStyle: 'focusRing',
  },
  _hover: {
    color: 'accent.text',
  },
});
