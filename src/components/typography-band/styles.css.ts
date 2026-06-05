import { css } from '@styled/css';

const bandBase = {
  position: 'fixed',
  overflow: 'hidden',
  zIndex: 'sticky',
  bg: 'accent.solid',
  color: 'fg.onSolid',
  fontFamily: 'mono',
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
