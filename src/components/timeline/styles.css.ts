import { css } from '@styled/css';

export const root = css({
  listStyle: 'none',
  borderLeftWidth: 'hairline',
  borderLeftStyle: 'solid',
  borderLeftColor: 'border.default',
  pl: '6',
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
});

export const item = css({
  position: 'relative',
  display: 'flex',
  alignItems: 'baseline',
  gap: '3',
});

export const dot = css({
  position: 'absolute',
  left: '[-1.625rem]',
  top: '[0.4em]',
  width: '2',
  height: '2',
  borderRadius: 'pill',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.strong',
  bg: 'bg.canvas',
  flexShrink: '0',
  '&[data-upcoming="true"]': {
    bg: 'accent.solid',
    borderColor: 'accent.solid',
  },
});

export const date = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  lineHeight: 'snug',
  color: 'fg.muted',
  flexShrink: '0',
  '&[data-upcoming="true"]': {
    color: 'accent.text',
  },
});

export const label = css({
  fontFamily: 'body',
  fontSize: 'sm',
  lineHeight: 'jp',
  color: 'fg.default',
  '&[data-upcoming="true"]': {
    color: 'accent.text',
  },
});

export const meta = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  lineHeight: 'snug',
  color: 'fg.muted',
});
