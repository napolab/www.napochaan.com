import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
  paddingBlock: 'section',
  paddingInline: 'page',
});

export const log = css({
  display: 'flex',
  flexDirection: 'column',
});

export const item = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  gap: 'inline',
  paddingBlock: 'element',
  borderBottomWidth: 'hairline',
  borderBottomStyle: 'dashed',
  borderBottomColor: 'border.subtle',
  '&:last-child': { borderBottomWidth: 'none' },
});

export const date = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  letterSpacing: 'wide',
  color: 'accent.text',
});

export const title = css({
  fontFamily: 'body',
  fontSize: 'md',
  lineHeight: 'snug',
  color: 'fg.default',
});
