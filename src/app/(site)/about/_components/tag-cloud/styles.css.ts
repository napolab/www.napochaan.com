import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'inline',
  listStyle: 'none',
});

// Outline code-chip: a quiet, legible inventory token. Black-on-paper with the
// outline carrying the box. The border is fg.subtle (≥3:1 vs the canvas, per
// WCAG 1.4.11 non-text contrast) so the ~40-chip cloud reads as actual chips,
// not floating text. The saturated accent is reserved for the hover lift. Sharp
// corners keep it aligned to the grid / code aesthetic.
export const chip = css({
  display: 'inline-flex',
  alignItems: 'center',
  paddingInline: '2',
  paddingBlock: '0.5',
  fontFamily: 'mono',
  fontSize: 'xs',
  lineHeight: 'snug',
  letterSpacing: 'wide',
  whiteSpace: 'nowrap',
  color: 'fg.default',
  bg: 'transparent',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'fg.subtle',
  borderRadius: 'none',
  transitionProperty: '[color,border-color]',
  transitionDuration: 'fast',
  transitionTimingFunction: 'stepSnap',
  _hover: {
    color: 'accent.text',
    borderColor: 'accent.solid',
  },
  '@media (prefers-reduced-motion: reduce)': {
    transitionDuration: 'instant',
  },
});
