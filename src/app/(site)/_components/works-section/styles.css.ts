import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
});

// Thumbnail: full-colour image displayed at a fixed 40 × 40 square.
export const thumb = css({
  width: '[40px]',
  height: '[40px]',
  objectFit: 'cover',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.default',
});

export const thumbPlaceholder = css({
  display: 'inline-block',
  width: '[40px]',
  height: '[40px]',
  bg: 'bg.muted',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.default',
});
