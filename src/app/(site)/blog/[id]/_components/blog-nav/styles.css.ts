import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'element',
  borderTopWidth: 'hairline',
  borderTopStyle: 'solid',
  borderTopColor: 'border.default',
  paddingTop: 'block',
});

export const pager = css({
  display: 'flex',
  alignItems: 'stretch',
  justifyContent: 'space-between',
  gap: 'element',
});

// Directional link. prev sits left and reads ‹ title; next sits right and reads
// title › via data-side.
export const link = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'inline',
  maxWidth: '[50%]',
  minWidth: '0',
  textDecorationLine: 'none',
  color: 'fg.default',
  fontFamily: 'body',
  fontSize: 'sm',
  transitionProperty: '[color]',
  transitionDuration: 'fast',
  transitionTimingFunction: 'stepSnap',
  '&[data-side="next"]': { marginInlineStart: 'auto', textAlign: 'right' },
});

export const arrow = css({
  flexShrink: '0',
  fontFamily: 'mono',
  fontSize: 'sm',
  color: 'fg.subtle',
});

export const label = css({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  // Underline so the prev/next title reads as a link (its colour matches body text).
  textDecorationLine: 'underline',
  textUnderlineOffset: '[2px]',
});

// Empty side: holds the space-between layout balanced when one neighbour is
// absent.
export const empty = css({
  display: 'block',
});

export const back = css({
  // Hug the text so the link isn't a full-width block (its hover never stretches
  // across the row).
  alignSelf: 'start',
  fontFamily: 'mono',
  fontSize: 'xs',
  letterSpacing: 'wide',
  color: 'fg.subtle',
  textDecorationLine: 'underline',
  textUnderlineOffset: '[2px]',
  _focusVisible: { layerStyle: 'focusRing' },
});
