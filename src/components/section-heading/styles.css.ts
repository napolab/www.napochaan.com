import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  alignItems: 'baseline',
  gap: 'element',
  borderBottomWidth: 'default',
  borderBottomStyle: 'solid',
  borderBottomColor: 'fg.default',
  paddingBottom: '[6px]',
});

export const no = css({
  fontFamily: 'mono',
  fontSize: 'sm',
  color: 'accent.text',
});

export const more = css({
  marginInlineStart: 'auto',
  fontFamily: 'mono',
  fontSize: 'xs',
  color: 'fg.muted',
});
