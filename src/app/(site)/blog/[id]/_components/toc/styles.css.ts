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

// Resting colour comes from the Link `tone="muted"` recipe — the static fallback
// where scroll-driven animations are unsupported. Where they are supported, the
// global `@supports` block animates `color` along each heading's view timeline
// (animations override normal declarations), so this class just owns typography.
export const link = css({
  display: 'inline-block',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'xs',
  lineHeight: 'snug',
  letterSpacing: 'wide',
});
