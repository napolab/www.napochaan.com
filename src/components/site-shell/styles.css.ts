import { css } from '@styled/css';

// The fixed full-screen frame the background Game of Life fills. The per-side
// --band-* offsets (band + safe-area inset, see global-css) keep it clear of the
// TypographyBand; the canvas inside just fills this box.
export const lifeFrame = css({
  position: 'fixed',
  top: '[var(--band-top)]',
  right: '[var(--band-right)]',
  bottom: '[var(--band-bottom)]',
  left: '[var(--band-left)]',
  zIndex: 'base',
  pointerEvents: 'none',
});

export const stage = css({
  position: 'relative',
  zIndex: 'base',
  // Clip transient horizontal overflow (e.g. the EchoText glitch momentarily
  // widening the wordmark) so it never reaches the viewport and judders the
  // fixed TypographyBand. `clip` is paint-only and leaves vertical flow intact.
  overflowX: 'clip',
  maxWidth: '[1180px]',
  marginInline: 'auto',
  // Clear the fixed TypographyBand on each side (safe-area-aware --band-*, see
  // global-css), plus breathing room. Mobile keeps the inline gap tight
  // (band + 8px) so content fits ≤375px; desktop widens it.
  paddingTop: '[calc(var(--band-top) + 20px)]',
  paddingBottom: '[calc(var(--band-bottom) + 20px)]',
  paddingLeft: { base: '[calc(var(--band-left) + 8px)]', desktop: '[calc(var(--band-left) + 24px)]' },
  paddingRight: { base: '[calc(var(--band-right) + 8px)]', desktop: '[calc(var(--band-right) + 24px)]' },
});
