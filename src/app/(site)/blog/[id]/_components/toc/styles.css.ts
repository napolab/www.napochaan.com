import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'inline',
  textAlign: 'left',
});

export const label = css({
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'xs',
  letterSpacing: 'wide',
  textTransform: 'uppercase',
  color: 'fg.subtle',
});

export const list = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'inline',
});

// h3 entries indent under their h2 via data-level. h2 (level 2) sits flush.
export const item = css({
  '&[data-level="3"]': { paddingInlineStart: 'block' },
});

export const link = css({
  display: 'inline-block',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'xs',
  lineHeight: 'snug',
  letterSpacing: 'wide',
});
