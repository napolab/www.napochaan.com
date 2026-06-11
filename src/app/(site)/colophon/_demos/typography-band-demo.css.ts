import { css } from '@styled/css';

// Contained frame the four edge-bands ride on. Opaque bg so the page's own band /
// background never bleeds through the demo.
export const frame = css({
  position: 'relative',
  width: 'full',
  height: '[176px]',
  overflow: 'hidden',
  bg: 'bg.canvas',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'fg.default',
});

const bandBase = {
  position: 'absolute',
  overflow: 'hidden',
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
  top: '0',
  left: '0',
  right: '0',
  height: 'band',
  flexDirection: 'row',
  borderBottomWidth: 'hairline',
  borderBottomStyle: 'solid',
  borderBottomColor: 'accent.solidHover',
});

export const bandBottom = css({
  ...bandBase,
  bottom: '0',
  left: '0',
  right: '0',
  height: 'band',
  flexDirection: 'row',
  borderTopWidth: 'hairline',
  borderTopStyle: 'solid',
  borderTopColor: 'accent.solidHover',
});

export const bandLeft = css({
  ...bandBase,
  top: '0',
  bottom: '0',
  left: '0',
  width: 'band',
  flexDirection: 'column',
  writingMode: '[vertical-rl]',
  borderRightWidth: 'hairline',
  borderRightStyle: 'solid',
  borderRightColor: 'accent.solidHover',
});

export const bandRight = css({
  ...bandBase,
  top: '0',
  bottom: '0',
  right: '0',
  width: 'band',
  flexDirection: 'column',
  writingMode: '[vertical-rl]',
  borderLeftWidth: 'hairline',
  borderLeftStyle: 'solid',
  borderLeftColor: 'accent.solidHover',
});

const trackXBase = {
  display: 'flex',
  flexShrink: '0',
  width: 'max',
  whiteSpace: 'nowrap',
  willChange: 'transform',
  animationName: 'marquee',
  animationDuration: '[14s]',
  animationTimingFunction: 'linear',
  animationIterationCount: 'infinite',
  animationPlayState: 'var(--motion-play, running)',
} as const;

export const trackX = css(trackXBase);
export const trackXReverse = css({ ...trackXBase, animationDirection: 'reverse' });

const trackYBase = {
  display: 'flex',
  flexDirection: 'column',
  flexShrink: '0',
  whiteSpace: 'nowrap',
  willChange: 'transform',
  animationName: 'marqueeY',
  animationDuration: '[14s]',
  animationTimingFunction: 'linear',
  animationIterationCount: 'infinite',
  animationPlayState: 'var(--motion-play, running)',
} as const;

export const trackY = css(trackYBase);
export const trackYReverse = css({ ...trackYBase, animationDirection: 'reverse' });
