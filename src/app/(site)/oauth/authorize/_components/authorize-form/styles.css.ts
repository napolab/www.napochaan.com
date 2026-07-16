import { css } from '@styled/css';

export const form = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  maxWidth: '[28rem]',
});

export const lead = css({
  color: 'fg.muted',
  fontSize: 'sm',
});

export const error = css({
  color: 'danger.text',
  fontSize: 'sm',
});
