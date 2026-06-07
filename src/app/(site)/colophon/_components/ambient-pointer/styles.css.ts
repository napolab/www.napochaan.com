import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  alignItems: 'baseline',
  gap: 'inline',
  fontFamily: 'mono',
  fontSize: 'xs',
  color: 'fg.muted',
});

export const marker = css({
  color: 'accent.text',
});

export const target = css({
  color: 'fg.default',
});
