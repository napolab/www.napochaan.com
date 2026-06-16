import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  padding: '6',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.subtle',
});

export const name = css({
  fontSize: 'h3',
  fontWeight: 'semibold',
  color: 'fg.default',
  lineHeight: 'tight',
  margin: '0',
});

export const summary = css({
  fontSize: 'sm',
  color: 'fg.muted',
  lineHeight: 'body',
  margin: '0',
});

export const latestRow = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  flexWrap: 'wrap',
});

export const badge = css({
  display: 'inline-flex',
  alignItems: 'center',
  px: '2',
  py: '1',
  fontSize: 'xs',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  color: 'accent.text',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'accent.border',
});

export const overlay = css({
  position: 'fixed',
  inset: '0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  // strictTokens escape: scrim color is a one-off semi-transparent black, no semantic token applies
  bg: '[oklch(0 0 0 / 0.6)]',
  zIndex: 'modal',
});

export const modal = css({
  display: 'flex',
  // strictTokens escape: viewport-relative modal sizing, no token applies
  maxW: '[90vw]',
  // strictTokens escape: viewport-relative modal sizing, no token applies
  w: '[480px]',
});

export const dialog = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  padding: '6',
  bg: 'bg.canvas',
  outline: 'none',
  w: 'full',
  // strictTokens escape: viewport-relative modal sizing, no token applies
  maxH: '[90vh]',
  overflow: 'auto',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.default',
});

export const dialogTitle = css({
  fontSize: 'lg',
  fontWeight: 'semibold',
  color: 'fg.default',
  margin: '0',
});

export const termsRoot = css({
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.subtle',
  padding: '3',
  fontSize: 'sm',
  color: 'fg.muted',
});

export const agree = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  fontSize: 'sm',
  color: 'fg.default',
  cursor: 'pointer',
});

export const error = css({
  fontSize: 'sm',
  color: 'danger.text',
  margin: '0',
});

export const history = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  borderTopWidth: 'hairline',
  borderTopStyle: 'solid',
  borderTopColor: 'border.subtle',
  paddingTop: '4',
});

export const historyTrigger = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  fontSize: 'xs',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  color: 'fg.muted',
  bg: 'transparent',
  borderWidth: 'none',
  padding: '0',
  cursor: 'pointer',
  letterSpacing: 'wide',
  textTransform: 'uppercase',
  _hover: {
    color: 'fg.default',
  },
  _focusVisible: {
    layerStyle: 'focusRing',
  },
});

export const historyList = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  listStyle: 'none',
  margin: '0',
  padding: '0',
  paddingTop: '2',
});

export const historyItem = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  fontSize: 'sm',
  color: 'fg.muted',
});

export const changelog = css({
  fontSize: 'xs',
  color: 'fg.subtle',
  lineHeight: 'body',
  margin: '0',
});
