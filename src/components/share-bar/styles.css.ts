import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
  marginBlock: '8',
});

export const label = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  fontVariationSettings: '"wght" 600',
  letterSpacing: 'wide',
  color: 'fg.muted',
  textTransform: 'uppercase',
});

export const actions = css({
  display: 'flex',
  gap: '3',
  flexWrap: 'wrap',
});
