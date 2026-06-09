import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: { base: 'column', desktop: 'row' },
  alignItems: 'stretch',
  justifyContent: 'space-between',
  gap: 'element',
  borderTopWidth: 'hairline',
  borderTopStyle: 'solid',
  borderTopColor: 'border.default',
  paddingTop: 'block',
});

// Directional link. The arrow + label flips ends via data-side: prev sits left
// and reads ‹ title; next sits right and reads title ›.
export const link = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'inline',
  maxWidth: { base: 'full', desktop: '[50%]' },
  minWidth: '0',
  fontFamily: 'body',
  fontSize: 'sm',
  transitionProperty: '[color]',
  transitionDuration: 'fast',
  transitionTimingFunction: 'stepSnap',
  // next reads `title ›` aligned to the RIGHT — both when stacked on mobile and
  // when it sits at the right end of the desktop row. justify-end right-packs the
  // label+arrow; marginInlineStart:auto pushes the whole link to the row's end.
  '&[data-side="next"]': {
    marginInlineStart: { base: '0', desktop: 'auto' },
    justifyContent: 'flex-end',
    textAlign: 'right',
  },
});

export const arrow = css({
  flexShrink: '0',
  fontFamily: 'mono',
  fontSize: 'sm',
  color: 'fg.subtle',
});

export const label = css({
  minWidth: '0',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  // Underline so the prev/next title reads as a link (its colour matches body text).
  textDecorationLine: 'underline',
  textUnderlineOffset: '[2px]',
});

// Empty side: holds the space-between layout balanced when one neighbour is
// absent. Hidden on mobile (column stack needs no spacer row).
export const empty = css({
  display: { base: 'none', desktop: 'block' },
});
