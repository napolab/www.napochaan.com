import { css } from '@styled/css';

export const root = css({
  display: 'inline-block',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'fg.default',
  borderRadius: 'none',
  m: '0',
});

// Fill the figure's content width so the image never leaves gaps when a wider
// caption stretches the box. height: auto keeps the aspect ratio (no crop).
export const image = css({
  display: 'block',
  width: 'full',
  height: 'auto',
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
