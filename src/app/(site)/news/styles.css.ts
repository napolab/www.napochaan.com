import { css } from '@styled/css';

export const main = css({
  display: 'flex',
  flexDirection: 'column',
  gap: { base: '8', desktop: 'section' },
});

export const feedRow = css({
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: '-4',
});

export const feedLink = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  letterSpacing: 'wide',
  color: 'fg.muted',
  textDecoration: 'none',
  '&:hover': {
    color: 'accent.text',
  },
});
