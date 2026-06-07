import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
});

export const item = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'inline',
});

// The principle headline — prominent, bold, the line that should land first.
export const term = css({
  fontFamily: 'body',
  fontWeight: 'bold',
  fontSize: { base: 'md', desktop: 'lg' },
  lineHeight: 'snug',
  color: 'fg.default',
});

export const description = css({
  margin: '0',
  fontFamily: 'body',
  fontSize: 'md',
  lineHeight: 'body',
  color: 'fg.muted',
  maxWidth: '[64ch]',
});
