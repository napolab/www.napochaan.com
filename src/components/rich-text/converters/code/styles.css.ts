import { css } from '@styled/css';

// DARK TERMINAL code block: ink bg, canvas text. Shiki paints token foregrounds
// via the --code-* variables below (theme `bg` is transparent, so this surface
// shows through). Provisional palette using existing tokens — a later task swaps
// these for dedicated colors.code.* tokens that meet WCAG AA on the ink background.
export const codeBlock = css({
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'sm',
  bg: 'fg.default',
  color: 'bg.canvas',
  p: 'element',
  borderRadius: 'none',
  overflowX: 'auto',
  marginBlockEnd: 'block',
  '&:last-child': { marginBlockEnd: '0' },
  '--code-fg': 'token(colors.bg.canvas)',
  '--code-comment': 'token(colors.fg.muted)',
  '--code-keyword': 'token(colors.accent.text)',
  '--code-string': 'token(colors.bg.canvas)',
  '--code-number': 'token(colors.accent.text)',
  '--code-function': 'token(colors.bg.canvas)',
  '--code-punctuation': 'token(colors.bg.canvas)',
});
