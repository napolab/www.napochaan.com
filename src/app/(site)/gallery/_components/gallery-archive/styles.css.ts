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

// Crosshatch filler for empty grid space (ragged bottom / internal gaps left by the
// skyline). Paper base + two perpendicular grid-line hatches read as a drafting fill.
// Decorative only (aria-hidden); positioned by the same --cell-* vars as photo cells.
export const blank = css({
  position: 'absolute',
  left: '[var(--cell-x)]',
  top: '[var(--cell-y)]',
  width: '[var(--cell-w)]',
  height: '[var(--cell-h)]',
  pointerEvents: 'none',
  bg: 'bg.canvas',
  backgroundImage:
    '[repeating-linear-gradient(45deg, var(--colors-grid-line) 0, var(--colors-grid-line) 1px, transparent 1px, transparent 6px), repeating-linear-gradient(-45deg, var(--colors-grid-line) 0, var(--colors-grid-line) 1px, transparent 1px, transparent 6px)]',
});
