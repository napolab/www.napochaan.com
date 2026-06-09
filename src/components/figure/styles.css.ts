import { css } from '@styled/css';

export const root = css({
  display: 'block',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'fg.default',
  borderRadius: 'none',
  m: '0',
});

// Uniform 16/10 frame: the image is contained so the whole picture is shown —
// never cropped. Portrait or square sources letterbox over a transparent backdrop
// instead of being clipped, matching the works detail proof frame.
export const image = css({
  display: 'block',
  width: 'full',
  aspectRatio: '[16 / 10]',
  objectFit: 'contain',
});

export const caption = css({
  display: 'block',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'xs',
  lineHeight: 'snug',
  color: 'fg.muted',
  px: 'element',
  py: '2',
  borderTopWidth: 'hairline',
  borderTopStyle: 'dashed',
  borderTopColor: 'border.subtle',
});
