import { css } from '@styled/css';

// Masonry container. Two modes via data-mode:
//  - flow: SSR / pre-measure fallback. CSS multi-columns, no JS needed.
//  - packed: skyline result applied; cells are absolutely positioned, height fixed.
// The grid-line background shows through the 2px seams as light blueprint rules,
// keeping the white-base "方眼紙" mood (photos read as floating on a drafting grid).
export const root = css({
  listStyle: 'none',
  position: 'relative',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'grid.line',
  bg: 'grid.line',
  '&[data-mode=flow]': {
    columnCount: 2,
    columnGap: '[2px]',
    tablet: { columnCount: 3 },
    desktop: { columnCount: 4 },
  },
  '&[data-mode=packed]': {
    height: '[var(--total-h)]',
  },
});

export const cell = css({
  position: 'relative',
  overflow: 'hidden',
  bg: 'bg.canvas',
  '[data-mode=flow] &': {
    display: 'block',
    breakInside: 'avoid',
    marginBottom: '[2px]',
  },
  '[data-mode=packed] &': {
    position: 'absolute',
    left: '[var(--cell-x)]',
    top: '[var(--cell-y)]',
    width: '[var(--cell-w)]',
    height: '[var(--cell-h)]',
  },
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

export const image = css({
  display: 'block',
  width: 'full',
  '[data-mode=flow] &': {
    height: 'auto',
  },
  '[data-mode=packed] &': {
    height: 'full',
    objectFit: 'cover',
  },
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

// Filler for empty grid space (ragged bottom / internal gaps left by the skyline).
// The void is "dimensioned" like a technical drawing: registration crosshairs at the
// corners + the cell's measured size and a reference number in the middle. Decorative
// (aria-hidden); positioned by the same --cell-* vars as photo cells.
export const blank = css({
  position: 'absolute',
  left: '[var(--cell-x)]',
  top: '[var(--cell-y)]',
  width: '[var(--cell-w)]',
  height: '[var(--cell-h)]',
  pointerEvents: 'none',
  overflow: 'hidden',
  bg: 'bg.canvas',
});

// Electric-blue registration crosshair pinned to a corner (data-pos selects which) —
// the drawing's alignment ticks.
export const corner = css({
  position: 'absolute',
  fontFamily: 'mono',
  fontSize: '[12px]',
  lineHeight: '[1]',
  color: 'accent.text',
  userSelect: 'none',
  '&[data-pos=tl]': { top: '[2px]', left: '[3px]' },
  '&[data-pos=tr]': { top: '[2px]', right: '[3px]' },
  '&[data-pos=bl]': { bottom: '[2px]', left: '[3px]' },
  '&[data-pos=br]': { bottom: '[2px]', right: '[3px]' },
});

// The measured size (W × H px) and a reference number, centered like a dimension
// callout. pre-line keeps the two lines from wrapping on width.
export const blankDim = css({
  position: 'absolute',
  inset: '0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  whiteSpace: 'pre-line',
  textAlign: 'center',
  fontFamily: 'mono',
  fontSize: '[11px]',
  letterSpacing: 'wide',
  lineHeight: '[1.45]',
  color: 'fg.muted',
  userSelect: 'none',
});
