import { css } from '@styled/css';

export const root = css({
  width: 'full',
  borderCollapse: 'collapse',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'fg.default',
  fontFamily: 'body',
  fontSize: 'sm',
  lineHeight: 'body',
});

export const caption = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  color: 'fg.muted',
  textAlign: 'left',
  py: '2',
  captionSide: 'bottom',
});

export const headerCell = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  fontWeight: 'semibold',
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

export const row = css({
  borderBottomWidth: 'hairline',
  borderBottomStyle: 'solid',
  borderBottomColor: 'border.subtle',
  transitionProperty: '[background-color]',
  transitionDuration: 'fast',
  transitionTimingFunction: 'stepSnap',
  _hover: {
    bg: 'bg.subtle',
  },
  '&:last-child': {
    borderBottomWidth: 'none',
  },
});

export const cell = css({
  px: 'element',
  py: '2',
  color: 'fg.default',
  verticalAlign: 'top',
});
