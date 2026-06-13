import { css } from '@styled/css';

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

// Reserve the lightbox image box BEFORE the bitmap loads to avoid layout shift:
// drive the height by the known aspect ratio (--ar = width/height, set inline by
// the component) and cap it to 80vh AND to the height that 88vw width allows, so a
// tall portrait never pushes the close button off-screen and a wide image never
// overflows. width follows the ratio (contain, no crop, no distortion).
export const modalImage = css({
  aspectRatio: '[var(--ar, 1)]',
  width: 'auto',
  height: '[min(80vh, calc(88vw / (var(--ar, 1))))]',
  objectFit: 'contain',
});

export const close = css({
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
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
