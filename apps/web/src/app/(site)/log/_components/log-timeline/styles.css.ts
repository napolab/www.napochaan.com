import { css } from '@styled/css';

// Year groups stack down the page; the gap between groups reads as the chronicle
// spine resetting at each year boundary.
export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: { base: '8', desktop: 'section' },
});

export const yearRoot = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
});

// Year label — a mono divider that anchors the timeline below it. A 2px accent
// rule under the number echoes the timeline's accent spine.
export const year = css({
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'lg',
  letterSpacing: 'wide',
  color: 'fg.default',
  paddingBottom: 'element',
  borderBottomWidth: '[2px]',
  borderBottomStyle: 'solid',
  borderBottomColor: 'accent.border',
});
