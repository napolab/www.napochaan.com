import { css } from '@styled/css';

// Foot-of-page nav: a column wrapper holding the prev/next pager row and the
// back-to-index link below it — mirrors blog-nav so works' bottom nav reads the
// same. The hairline + paddingTop separate it from the article above.
export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'element',
  borderTopWidth: 'hairline',
  borderTopStyle: 'solid',
  borderTopColor: 'border.default',
  paddingTop: 'block',
});

// prev / next row. Was the old `root`: stretch + space-between, stacking on mobile.
export const pager = css({
  display: 'flex',
  flexDirection: { base: 'column', desktop: 'row' },
  alignItems: 'stretch',
  justifyContent: 'space-between',
  gap: 'element',
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
  fontVariationSettings: '"wght" 600',
  fontSize: 'sm',
  color: 'fg.subtle',
});

export const label = css({
  // min-width:0 lets this flex item shrink below its content so the ScrambleText
  // inside (truncate mode) can cap at the available width and ellipsise. The
  // single-line clip lives in ScrambleText: its painted text is an absolute box a
  // `text-overflow` here could never reach, so the label only owns the underline.
  minWidth: '0',
  // Underline so the prev/next title reads as a link (its colour matches body text).
  textDecorationLine: 'underline',
  textUnderlineOffset: '[2px]',
});

// Empty side: holds the space-between layout balanced when one neighbour is
// absent. Hidden on mobile (column stack needs no spacer row).
export const empty = css({
  display: { base: 'none', desktop: 'block' },
});
