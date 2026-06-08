import { css } from '@styled/css';

// Skyline masonry in column-width (cw) units. The packing is precomputed for 2 / 3 / 4
// columns; media queries pick --cols (and which cw-unit set each cell reads), and the
// container query unit `cqw` turns the units into pixels — so the layout is exact,
// responsive and shift-free with zero measurement. The 2px seams come from 1px cell
// borders (the packing has no gap). The container is itself the query container, and
// reserves its height via aspect-ratio (cols : total) since an element cannot read its
// own cqw.
export const root = css({
  listStyle: 'none',
  position: 'relative',
  containerType: 'inline-size',
  borderWidth: '[1px]',
  borderStyle: 'solid',
  borderColor: 'grid.line',
  '--cols': '[2]',
  '--total': '[var(--total-2)]',
  tablet: { '--cols': '[3]', '--total': '[var(--total-3)]' },
  desktop: { '--cols': '[4]', '--total': '[var(--total-4)]' },
  aspectRatio: '[var(--cols) / var(--total)]',
});

// Each cell reads the active breakpoint's cw-unit coordinates and scales them with
// 100cqw / --cols (the column width). box-sizing + 1px border draws the seam.
export const cell = css({
  position: 'absolute',
  overflow: 'hidden',
  boxSizing: 'border-box',
  borderWidth: '[1px]',
  borderStyle: 'solid',
  borderColor: 'grid.line',
  bg: 'bg.canvas',
  '--col': '[var(--col-2)]',
  '--span': '[var(--span-2)]',
  '--y': '[var(--y-2)]',
  '--h': '[var(--h-2)]',
  tablet: { '--col': '[var(--col-3)]', '--span': '[var(--span-3)]', '--y': '[var(--y-3)]', '--h': '[var(--h-3)]' },
  desktop: { '--col': '[var(--col-4)]', '--span': '[var(--span-4)]', '--y': '[var(--y-4)]', '--h': '[var(--h-4)]' },
  left: '[calc(var(--col) * 100cqw / var(--cols))]',
  width: '[calc(var(--span) * 100cqw / var(--cols))]',
  top: '[calc(var(--y) * 100cqw / var(--cols))]',
  height: '[calc(var(--h) * 100cqw / var(--cols))]',
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
  // next/image fill: the image is absolutely sized to the (already-sized) cell from the
  // first paint, so it never reflows while its intrinsic size resolves.
  width: 'full',
  height: 'full',
  objectFit: 'cover',
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

// Filler for empty grid space. A blank belongs to one breakpoint's layout (the packing
// differs per column count), so all three sets are rendered and shown via data-bp.
export const blank = css({
  position: 'absolute',
  overflow: 'hidden',
  boxSizing: 'border-box',
  borderWidth: '[1px]',
  borderStyle: 'solid',
  borderColor: 'grid.line',
  bg: 'bg.canvas',
  display: 'none',
  left: '[calc(var(--col) * 100cqw / var(--cols))]',
  width: '[calc(100cqw / var(--cols))]',
  top: '[calc(var(--y) * 100cqw / var(--cols))]',
  height: '[calc(var(--h) * 100cqw / var(--cols))]',
  '&[data-bp="0"]': { display: 'block', tablet: { display: 'none' } },
  '&[data-bp="1"]': { tablet: { display: 'block' }, desktop: { display: 'none' } },
  '&[data-bp="2"]': { desktop: { display: 'block' } },
});

// Electric-blue registration crosshair pinned to a corner (data-pos selects which).
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

// A reference number + status, centered like a dimension callout.
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
