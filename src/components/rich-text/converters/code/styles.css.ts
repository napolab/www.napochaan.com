import { css } from '@styled/css';

// DARK TERMINAL code block: ink bg (fg.default = gray-12), syntax colors from
// the dedicated code.* semantic tokens (WCAG AA ≥4.5:1 on ink).
// Shiki paints token foregrounds via the --code-* variables below (theme `bg`
// is transparent, so this surface shows through).
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
  '--code-fg': 'token(colors.code.fg)',
  '--code-comment': 'token(colors.code.comment)',
  '--code-keyword': 'token(colors.code.keyword)',
  '--code-string': 'token(colors.code.string)',
  '--code-number': 'token(colors.code.number)',
  '--code-function': 'token(colors.code.function)',
  '--code-punctuation': 'token(colors.code.punctuation)',
});
