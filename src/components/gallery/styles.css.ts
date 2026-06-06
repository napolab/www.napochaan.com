import { css } from '@styled/css';

// Editorial gallery: a fixed 6×6 grid whose named template areas tile completely
// (no empty cells), so the dark 2px gaps read as crisp grid lines with nothing to
// fill awkwardly. aspect-ratio keeps the cell proportions stable at any width; the
// ink background only shows through the seams. Each item is placed by area name and
// cover-crops to its cell, framed per-item via --gallery-object-position.
export const root = css({
  listStyle: 'none',
  display: 'grid',
  aspectRatio: '[6 / 5]',
  gridTemplateColumns: 'repeat(6, 1fr)',
  gridTemplateRows: 'repeat(6, 1fr)',
  gridTemplateAreas: `
    "lead lead wide   wide   wide   wide"
    "lead lead wide   wide   wide   wide"
    "lead lead square square column column"
    "sub  sub  square square column column"
    "sub  sub  inset  inset  column column"
    "sub  sub  inset  inset  column column"
  `,
  gap: '[2px]',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'fg.default',
  bg: 'fg.default',
});

export const cell = css({
  position: 'relative',
  overflow: 'hidden',
  gridArea: '[var(--gallery-area)]',
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
  _hover: {
    outlineWidth: 'strong',
    outlineStyle: 'solid',
    outlineColor: 'accent.solid',
    outlineOffset: '[-3px]',
    zIndex: '[2]',
  },
  _focusVisible: {
    layerStyle: 'focusRing',
  },
});

export const gridImage = css({
  width: 'full',
  height: 'full',
  objectFit: 'cover',
  objectPosition: '[var(--gallery-object-position, center)]',
});

export const caption = css({
  position: 'absolute',
  left: '0',
  bottom: '0',
  zIndex: '[1]',
  pointerEvents: 'none',
  fontFamily: 'mono',
  fontSize: '[10px]',
  letterSpacing: 'wide',
  bg: 'fg.default',
  color: 'fg.onSolid',
  paddingInline: '[6px]',
  paddingBlock: '[1px]',
});

// Dim backdrop that fills the viewport and centers the modal. isDismissable on the
// ModalOverlay closes the lightbox when this backdrop (outside the Modal) is clicked.
export const overlay = css({
  position: 'fixed',
  inset: '0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  bg: '[oklch(0 0 0 / 0.8)]',
  zIndex: 'modal',
});

export const modal = css({
  display: 'flex',
  maxW: '[90vw]',
  maxH: '[90vh]',
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

// Cap the lightbox image height so a tall portrait never pushes the close
// button off-screen; width follows the aspect ratio (contain, no crop).
export const modalImage = css({
  width: 'auto',
  height: 'auto',
  maxW: '[88vw]',
  maxH: '[80vh]',
  objectFit: 'contain',
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
