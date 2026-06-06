import { css } from '@styled/css';

export const stage = css({
  position: 'relative',
  zIndex: 'base',
  maxWidth: '[1180px]',
  marginInline: 'auto',
  paddingBlock: '[calc(24px + 20px)]',
  // Clear the fixed 24px TypographyBand on each side, plus breathing room.
  // Mobile keeps the gap tight (band + 8px) so content fits ≤375px; desktop widens it.
  paddingInline: { base: '[calc(24px + 8px)]', desktop: '[calc(24px + 24px)]' },
});
