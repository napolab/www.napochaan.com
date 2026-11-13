import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: '-4',
});

export const link = css({
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'xs',
  letterSpacing: 'wide',
  color: 'fg.muted',
  textDecoration: 'none',
  '&:hover': {
    color: 'accent.text',
  },
});
