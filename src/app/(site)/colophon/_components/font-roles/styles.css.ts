import { css } from '@styled/css';

export const root = css({
  display: 'grid',
  gridTemplateColumns: '[max-content 1fr]',
  columnGap: 'block',
  rowGap: 'block',
});

export const row = css({
  display: 'grid',
  gridColumn: '[1 / -1]',
  gridTemplateColumns: '[subgrid]',
  alignItems: 'baseline',
});

// The family name set in its own typeface.
export const family = css({
  fontSize: 'h3',
  color: 'fg.default',
  '&[data-font="display"]': { fontFamily: 'display' },
  '&[data-font="body"]': { fontFamily: 'body' },
  '&[data-font="mono"]': { fontFamily: 'mono' },
});

export const detail = css({
  margin: '0',
  display: 'flex',
  flexDirection: 'column',
  gap: 'inline',
});

export const role = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  letterSpacing: 'wide',
  textTransform: 'uppercase',
  color: 'fg.muted',
});

export const why = css({
  margin: '0',
  fontFamily: 'body',
  fontSize: 'sm',
  lineHeight: 'body',
  color: 'fg.muted',
  maxWidth: '[60ch]',
});
