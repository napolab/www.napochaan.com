import { css } from '@styled/css';

export const main = css({
  display: 'flex',
  flexDirection: 'column',
  gap: { base: '8', desktop: 'section' },
});

// Desktop pairs 01 whoami (narrow) and 02 bio (wide) into an asymmetric
// two-column grid; mobile stacks them. The remaining sections are full width.
export const topGrid = css({
  display: 'grid',
  gap: { base: '8', desktop: 'section' },
  gridTemplateColumns: { base: '[1fr]', desktop: '[minmax(0, 4fr) minmax(0, 8fr)]' },
});

export const cell = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
});
