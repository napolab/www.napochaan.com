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
  // Stack SysBar / page <main> / SiteFooter as a column that is at least one
  // dynamic viewport tall, so the footer is pinned to the bottom of the fold even
  // when a page is short. Each page <main> carries `flexGrow: 1` to absorb the
  // slack, which keeps the footer's section-rhythm top margin intact (the grow
  // resolves to 0 on pages already taller than the viewport). `dvh` tracks the
  // iOS dynamic toolbar so the fold height stays correct as it expands/collapses.
  display: 'flex',
  flexDirection: 'column',
  minHeight: '[100dvh]',
  // Clip transient horizontal overflow (e.g. the EchoText glitch momentarily
  // widening the wordmark) so it never reaches the viewport and judders the
  // fixed TypographyBand. `clip` is paint-only and leaves vertical flow intact.
  overflowX: 'clip',
  // Keep ink that sits in the left/right gutter visible while still clipping the
  // wider transient overflow — the colophon demo-stage pattern. Sized to clear the
  // richtext heading copy-anchor, which sits a full `-1.5em` into the gutter (up to
  // ~49px at an h2) plus its focus ring; `8px` clipped it. `clip` never creates a
  // scrollbar, so a larger margin cannot reintroduce the band-judder this guards
  // against — it only lets a little more edge ink paint.
  overflowClipMargin: '[2.5rem]',
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
