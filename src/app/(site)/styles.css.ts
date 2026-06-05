import { css } from '@styled/css';

export const main = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minH: 'svh',
  gap: '6',
  paddingInline: 'page',
  textAlign: 'center',
});

export const lead = css({
  fontSize: 'lg',
  color: 'fg.muted',
  maxW: '[40ch]',
});
