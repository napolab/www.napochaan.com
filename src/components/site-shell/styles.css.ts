import { css } from '@styled/css';

// The fixed full-screen frame the background Game of Life fills. inset: band keeps it
// clear of the TypographyBand; the canvas inside just fills this box.
export const lifeFrame = css({
  position: 'fixed',
  inset: '[token(sizes.band)]',
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
  paddingBlock: '[calc(24px + 20px)]',
  // Clear the fixed 24px TypographyBand on each side, plus breathing room.
  // Mobile keeps the gap tight (band + 8px) so content fits ≤375px; desktop widens it.
  paddingInline: { base: '[calc(24px + 8px)]', desktop: '[calc(24px + 24px)]' },
});
