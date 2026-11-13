import { css } from '@styled/css';

// Each band spans its 24px (sizes.band) plus the device safe-area inset on its
// edge (--band-* from global-css), so the brand-blue frame paints the full
// physical edge on iOS (notch / home indicator / landscape ears). The matching
// env() padding pushes the marquee text into the inner 24px content box
// (box-sizing is border-box via Panda preflight), keeping it clear of the
// status bar and home indicator.
//
// On top of that, the top/bottom bands BLEED past the viewport edges. iOS 26
// Safari's Liquid Glass chrome (status-bar "forehead" / toolbar "chin") shows
// the page pixels just OUTSIDE the layout viewport — env(safe-area-inset-*) is
// 0 in browser mode, so an edge-pinned band can never reach those regions, and
// once scrolled the forehead shows whatever content slid above the viewport
// (white). Bleeding the blue band past the edge keeps real blue pixels behind
// the glass at every scroll position. Sizes are generous estimates of the
// chrome extents (~62px forehead / ~136px chin per field reports); overshoot is
// harmless — fixed elements never create scrollable overflow.
const BLEED_TOP = '80px';
const BLEED_BOTTOM = '150px';

const bandBase = {
  position: 'fixed',
  overflow: 'hidden',
  zIndex: 'sticky',
  bg: 'accent.solid',
  color: 'fg.onSolid',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'xs',
  letterSpacing: 'wide',
  textTransform: 'uppercase',
  pointerEvents: 'none',
  userSelect: 'none',
  display: 'flex',
  alignItems: 'center',
} as const;

export const bandTop = css({
  ...bandBase,
  top: `[-${BLEED_TOP}]`,
  left: '0',
  right: '0',
  height: `[calc(${BLEED_TOP} + var(--band-top))]`,
  paddingTop: `[calc(${BLEED_TOP} + env(safe-area-inset-top, 0px))]`,
  flexDirection: 'row',
  borderBottomWidth: 'hairline',
  borderBottomStyle: 'solid',
  borderBottomColor: 'accent.solidHover',
});

export const bandBottom = css({
  ...bandBase,
  bottom: `[-${BLEED_BOTTOM}]`,
  left: '0',
  right: '0',
  height: `[calc(${BLEED_BOTTOM} + var(--band-bottom))]`,
  paddingBottom: `[calc(${BLEED_BOTTOM} + env(safe-area-inset-bottom, 0px))]`,
  flexDirection: 'row',
  borderTopWidth: 'hairline',
  borderTopStyle: 'solid',
  borderTopColor: 'accent.solidHover',
});

export const bandLeft = css({
  ...bandBase,
  top: `[-${BLEED_TOP}]`,
  bottom: `[-${BLEED_BOTTOM}]`,
  left: '0',
  width: '[var(--band-left)]',
  paddingLeft: '[env(safe-area-inset-left, 0px)]',
  flexDirection: 'column',
  writingMode: '[vertical-rl]',
  borderRightWidth: 'hairline',
  borderRightStyle: 'solid',
  borderRightColor: 'accent.solidHover',
});

export const bandRight = css({
  ...bandBase,
  top: `[-${BLEED_TOP}]`,
  bottom: `[-${BLEED_BOTTOM}]`,
  right: '0',
  width: '[var(--band-right)]',
  paddingRight: '[env(safe-area-inset-right, 0px)]',
  flexDirection: 'column',
  writingMode: '[vertical-rl]',
  borderLeftWidth: 'hairline',
  borderLeftStyle: 'solid',
  borderLeftColor: 'accent.solidHover',
});

export const track = css({
  display: 'flex',
  flexShrink: '0',
  whiteSpace: 'nowrap',
  willChange: 'transform',
});

export const trackVertical = css({
  display: 'flex',
  flexShrink: '0',
  whiteSpace: 'nowrap',
  willChange: 'transform',
  flexDirection: 'column',
});
