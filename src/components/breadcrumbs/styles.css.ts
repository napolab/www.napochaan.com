import { css } from '@styled/css';

export const root = css({
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'xs',
  lineHeight: 'snug',
});

export const list = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  listStyle: 'none',
  m: '0',
  p: '0',
});

export const item = css({
  display: 'inline-flex',
  alignItems: 'center',
  color: 'fg.muted',
  '&[data-first="false"]': {
    _before: {
      content: '"/"',
      mx: 'inline',
      color: 'fg.subtle',
    },
  },
});

export const current = css({
  color: 'fg.default',
  fontWeight: 'medium',
});
