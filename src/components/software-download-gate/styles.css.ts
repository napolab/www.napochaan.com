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

export const versionList = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '0',
  listStyle: 'none',
  margin: '0',
  padding: '0',
});

export const versionRow = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  padding: '3',
  borderTopWidth: 'hairline',
  borderTopStyle: 'solid',
  borderTopColor: 'border.subtle',
});

export const versionRowHeader = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  flexWrap: 'wrap',
});

export const versionMeta = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  flex: '1',
  flexWrap: 'wrap',
});

export const versionLabel = css({
  fontSize: 'sm',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  color: 'fg.default',
});

export const chevron = css({
  flexShrink: '0',
  // strictTokens escape: simple icon rotation transition; no token category applies
  transition: '[transform 0.15s ease]',
  '&[data-expanded]': {
    transform: 'rotate(90deg)',
  },
});

export const versionDate = css({
  fontSize: 'xs',
  color: 'fg.muted',
  fontFamily: 'mono',
});

export const downloadCell = css({
  // strictTokens escape: fixed pixel width so all download buttons align in a consistent right column
  minW: '[120px]',
  display: 'flex',
  justifyContent: 'flex-end',
  flexShrink: '0',
});

export const releaseNoteDisclosure = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
});

export const releaseNoteTrigger = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  fontSize: 'xs',
  color: 'fg.muted',
  bg: 'transparent',
  borderWidth: 'none',
  padding: '0',
  cursor: 'pointer',
  // No underline — the chevron marks this as a toggle, not a link.
  _hover: {
    color: 'fg.default',
  },
  _focusVisible: {
    layerStyle: 'focusRing',
  },
});

export const changelog = css({
  fontSize: 'xs',
  // fg.muted (7.04:1 on bg.canvas) clears WCAG 2.1 AA for normal text; fg.subtle was 4.03:1.
  color: 'fg.muted',
  lineHeight: 'body',
  margin: '0',
  // Indent + left rule so the note reads as one level below the disclosure trigger.
  marginLeft: '1',
  paddingTop: '1',
  paddingLeft: '3',
  borderLeftWidth: 'hairline',
  borderLeftStyle: 'solid',
  borderLeftColor: 'border.default',
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
