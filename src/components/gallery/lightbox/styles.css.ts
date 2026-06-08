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
