import { css } from '@styled/css';

// Table layout
export const tableScroll = css({
  overflowX: 'auto',
  marginBlockEnd: 'block',
  '&:last-child': { marginBlockEnd: '0' },
});

export const tableRoot = css({
  width: 'full',
  borderCollapse: 'collapse',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'fg.default',
  fontFamily: 'body',
  fontSize: 'sm',
  lineHeight: 'body',
});

export const headerCell = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  fontVariationSettings: '"wght" 600',
  lineHeight: 'snug',
  letterSpacing: 'wide',
  textTransform: 'uppercase',
  color: 'fg.muted',
  textAlign: 'left',
  px: 'element',
  py: '2',
  borderBottomWidth: 'default',
  borderBottomStyle: 'solid',
  borderBottomColor: 'fg.default',
  bg: 'bg.subtle',
});

export const cell = css({
  px: 'element',
  py: '2',
  color: 'fg.default',
  verticalAlign: 'top',
  borderBottomWidth: 'hairline',
  borderBottomStyle: 'solid',
  borderBottomColor: 'border.subtle',
  '[data-row]:last-child &': { borderBottomWidth: 'none' },
  _groupHover: { bg: 'bg.subtle' },
});

export const tableRow = css({
  transitionProperty: '[background-color]',
  transitionDuration: 'fast',
  transitionTimingFunction: 'stepSnap',
  _hover: { bg: 'bg.subtle' },
  '&:last-child td': { borderBottomWidth: 'none' },
});
