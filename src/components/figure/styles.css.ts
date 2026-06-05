import { css } from '@styled/css';

export const root = css({
  display: 'inline-block',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'fg.default',
  borderRadius: 'none',
  m: '0',
});

export const caption = css({
  display: 'block',
  fontFamily: 'mono',
  fontSize: 'xs',
  lineHeight: 'snug',
  color: 'fg.muted',
  px: 'element',
  py: '2',
  borderTopWidth: 'hairline',
  borderTopStyle: 'dashed',
  borderTopColor: 'border.subtle',
});
