import { css } from '@styled/css';

// These values mirror the safeAreaChase keyframes in panda.config.ts
// (from/to: translateY(calc(var(--band-top, 24px) - 160px)) …) — keep both in
// sync.
const STRIP_HEIGHT = '160px';
// The strip's in-viewport sliver is exactly the TypographyBand's extent
// (--band-top from global-css), so the band fully covers it on every platform —
// any larger and the band reads thicker on desktop; any smaller and toolbar
// transitions can flash a gap.
const VIEWPORT_OVERLAP = 'var(--band-top, 24px)';

// Anchored to the initial containing block (document origin) — deliberately NOT
// inside a positioned ancestor. height 0 + overflow visible so it has no layout
// or hit-testing footprint.
export const root = css({
  position: 'absolute',
  top: '0',
  left: '0',
  right: '0',
  height: '0',
  overflow: 'visible',
  pointerEvents: 'none',
  // Same token as TypographyBand; SiteShell renders this component BEFORE the
  // band so the band paints on top.
  zIndex: 'sticky',
});

export const strip = css({
  position: 'absolute',
  top: '0',
  left: '0',
  right: '0',
  height: `[${STRIP_HEIGHT}]`,
  bg: 'accent.solid',
  // Resting/fallback state: bottom edge at (document top + overlap). Without
  // scroll-timeline support the strip just stays at the document top, invisible
  // above the first paintable pixel.
  transform: `[translateY(calc(${VIEWPORT_OVERLAP} - ${STRIP_HEIGHT}))]`,
  // Bottom edge chases (viewport top + overlap) at every scroll position.
  animation: '[safeAreaChase linear]',
  animationTimeline: '[scroll(root block)]',
});

// Clips the chin strip to the document bounds. Absolute boxes extend the
// scrollable overflow in the block-end direction (unlike the top strip's
// negative offsets), so an unclipped chin strip grows the page by its
// below-viewport tail — and feeds that growth back into --scroll-range.
// --doc-h is the body box height (which absolute strips cannot inflate),
// published by scroll-range-sync.
export const bottomClip = css({
  position: 'absolute',
  top: '0',
  left: '0',
  right: '0',
  height: '[var(--doc-h, 100dvh)]',
  overflow: 'clip',
  pointerEvents: 'none',
});

// Chin counterpart. The static top already encodes (first-screen viewport
// bottom - overlap) via --viewport-h (published by scroll-range-sync), so the
// safeAreaChaseBottom keyframes are a pure scrollY follow: the strip's top edge
// holds at (viewport bottom - overlap) at every scroll position. Overlap stays
// under the bottom TypographyBand's 24px browser-mode height so the band hides
// the in-viewport sliver.
const STRIP_BOTTOM_HEIGHT = '200px';
const VIEWPORT_OVERLAP_BOTTOM = '16px';

export const stripBottom = css({
  position: 'absolute',
  left: '0',
  right: '0',
  top: `[calc(var(--viewport-h, 100dvh) - ${VIEWPORT_OVERLAP_BOTTOM})]`,
  height: `[${STRIP_BOTTOM_HEIGHT}]`,
  bg: 'accent.solid',
  // Unlike the top strip, the no-timeline resting position is INSIDE the
  // document (first-screen bottom) and would surface mid-page once scrolled
  // past — so the chin strip only exists where the scroll timeline does.
  display: 'none',
  '@supports (animation-timeline: scroll())': {
    display: 'block',
    animation: '[safeAreaChaseBottom linear]',
    animationTimeline: '[scroll(root block)]',
  },
});
