import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'inline',
  listStyle: 'none',
});

// Outline code-chip: a quiet, legible inventory token. Black-on-paper with the
// outline carrying the box. An opaque bg.subtle fill blocks the ambient grid
// from bleeding through the chip (it would otherwise show through behind the
// text and make the cloud read as floating glyphs). The border is fg.subtle
// (≥3:1 vs the canvas, per WCAG 1.4.11 non-text contrast). The saturated accent
// is reserved for the hover lift. Sharp corners keep it aligned to the grid /
// code aesthetic. The wght 600 variation drives config-mono-vf's variable axis
// so the Latin labels read with full weight (font-weight stays inherited so it
// never affects a JP fallback — these labels are en-only anyway).
export const chip = css({
  display: 'inline-flex',
  alignItems: 'center',
  paddingInline: '2',
  paddingBlock: '0.5',
  fontFamily: 'mono',
  fontSize: 'xs',
  fontVariationSettings: '"wght" 600',
  lineHeight: 'snug',
  letterSpacing: 'wide',
  whiteSpace: 'nowrap',
  color: 'fg.default',
  bg: 'bg.subtle',
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
