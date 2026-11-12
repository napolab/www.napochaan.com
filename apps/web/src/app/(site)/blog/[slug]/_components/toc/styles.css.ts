import { css } from '@styled/css';

// Faint corner brackets frame the TOC as a distinct region. A single `::before`
// overlay draws all four L-shaped ticks from eight hairline gradient strips
// (one horizontal + one vertical per corner), so there is no extra DOM and
// `::after` stays free. `element` padding holds the ticks off the text (額装);
// the static `border.strong` tone keeps the frame as ground — reading-progress
// colour lives on the links, never here.
export const root = css({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: 'inline',
  padding: 'element',
  textAlign: 'left',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: '0',
    pointerEvents: 'none',
    backgroundRepeat: 'no-repeat',
    backgroundImage:
      '[linear-gradient(token(colors.border.strong), token(colors.border.strong)), linear-gradient(token(colors.border.strong), token(colors.border.strong)), linear-gradient(token(colors.border.strong), token(colors.border.strong)), linear-gradient(token(colors.border.strong), token(colors.border.strong)), linear-gradient(token(colors.border.strong), token(colors.border.strong)), linear-gradient(token(colors.border.strong), token(colors.border.strong)), linear-gradient(token(colors.border.strong), token(colors.border.strong)), linear-gradient(token(colors.border.strong), token(colors.border.strong))]',
    backgroundPosition: '[0 0, 0 0, 100% 0, 100% 0, 0 100%, 0 100%, 100% 100%, 100% 100%]',
    backgroundSize:
      '[token(spacing.inline) 1px, 1px token(spacing.inline), token(spacing.inline) 1px, 1px token(spacing.inline), token(spacing.inline) 1px, 1px token(spacing.inline), token(spacing.inline) 1px, 1px token(spacing.inline)]',
  },
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
