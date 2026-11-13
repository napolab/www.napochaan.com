import { css } from '@styled/css';

// Editorial gallery: a fixed 6×6 grid whose named template areas tile completely
// (no empty cells), so the 2px gaps read as crisp grid lines with nothing to
// fill awkwardly. aspect-ratio keeps the cell proportions stable at any width; the
// grid-line background only shows through the seams (matching the /gallery archive).
// Each item is placed by area name and cover-crops to its cell, framed per-item via
// --gallery-object-position.
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
  borderColor: 'grid.line',
  bg: 'grid.line',
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
  // Hover / focus indicator as a pseudo border above the photo (matching GalleryArchive):
  // hover shows an accent band; focus adds an outer ink ring.
  _after: {
    content: '""',
    position: 'absolute',
    inset: '0',
    borderWidth: 'strong',
    borderStyle: 'solid',
    borderColor: 'accent.solid',
    opacity: '[0]',
    pointerEvents: 'none',
    zIndex: '[3]',
  },
  _hover: {
    zIndex: '[2]',
    _after: { opacity: '[1]' },
  },
  _focusVisible: {
    zIndex: '[2]',
    _after: {
      opacity: '[1]',
      inset: '[3px]',
      outlineWidth: 'strong',
      outlineStyle: 'solid',
      outlineColor: 'fg.default',
      outlineOffset: '0',
    },
  },
});

export const gridImage = css({
  width: 'full',
  height: 'full',
  objectFit: 'cover',
  objectPosition: '[var(--gallery-object-position, center)]',
  // Spotlight hover (matching GalleryArchive): the other photos desaturate while one is
  // hovered, and the hovered one zooms slightly (motion-safe; clipped by the cell).
  // Gated on `(hover: hover)` so touch devices (where :hover sticks on tap) never
  // desaturate the grid.
  filter: '[grayscale(0)]',
  '[data-gallery]:hover li:not(:hover) &': {
    '@media (hover: hover)': { filter: '[grayscale(1)]' },
  },
  _motionSafe: {
    transition: '[filter 0.4s ease, transform 0.4s ease]',
    'li:hover &': { transform: '[scale(1.05)]' },
  },
});

export const caption = css({
  position: 'absolute',
  left: '0',
  bottom: '0',
  zIndex: '[1]',
  pointerEvents: 'none',
  // Never wrap: the label is a one-line corner tag; clip overflow with an ellipsis
  // so long captions can't grow the tag past its cell.
  maxWidth: 'full',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: '[10px]',
  letterSpacing: 'wide',
  bg: 'fg.default',
  color: 'fg.onSolid',
  paddingInline: '[6px]',
  paddingBlock: '[1px]',
});
