import { css } from '@styled/css';

// Two shared tracks (label / value); each row is a subgrid so every dt lines up
// in the max-content column and every dd starts on the same vertical edge —
// rather than each row sizing its label independently.
export const root = css({
  display: 'grid',
  gridTemplateColumns: '[max-content 1fr]',
  columnGap: 'element',
  rowGap: 'inline',
});

export const row = css({
  display: 'grid',
  gridColumn: '[1 / -1]',
  gridTemplateColumns: '[subgrid]',
  alignItems: 'baseline',
});

export const term = css({
  fontFamily: 'mono',
  fontSize: 'sm',
  color: 'fg.muted',
});

export const description = css({
  margin: '0',
  fontFamily: 'mono',
  fontSize: 'sm',
  color: 'fg.default',
});
