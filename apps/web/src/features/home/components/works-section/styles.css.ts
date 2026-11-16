import { css } from '@styled/css';

// Below the fold: rendering deferred until it nears the viewport (belowFold
// utility; value = measured mobile 412 / desktop 1280 height).
export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
  belowFold: { base: '709px', desktop: '280px' },
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
