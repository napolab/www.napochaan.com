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
  _hover: {
    outlineWidth: 'strong',
    outlineStyle: 'solid',
    outlineColor: 'accent.solid',
    outlineOffset: '[-3px]',
    zIndex: '[2]',
  },
  // Two-tone focus ring drawn over the photo via an overlay pseudo so it wins on
  // any image: an inner accent band (border) plus an outer ink ring (outline).
  // Inset 3px from the cell edge so the parent's overflow:hidden can't crop it,
  // and z-raised so it sits above the cover image rather than behind it.
  _focusVisible: {
    _after: {
      content: '""',
      position: 'absolute',
      inset: '[3px]',
      borderWidth: 'strong',
      borderStyle: 'solid',
      borderColor: 'accent.solid',
      outlineWidth: 'strong',
      outlineStyle: 'solid',
      outlineColor: 'fg.default',
      outlineOffset: '0',
      pointerEvents: 'none',
      zIndex: '[3]',
    },
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
