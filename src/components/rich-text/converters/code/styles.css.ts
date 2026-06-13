import { css } from '@styled/css';

// Light panel code block: light grey bg.muted (gray-3) surface with a hairline
// border. Shiki paints token foregrounds via the --code-* variables below
// (theme `bg` is transparent so this surface shows through); syntax palette
// is dark-on-light, WCAG AA ≥4.5:1 on gray-3.
export const codeBlock = css({
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'sm',
  bg: 'bg.muted',
  color: 'fg.default',
  borderWidth: '[1px]',
  borderStyle: 'solid',
  borderColor: 'border.subtle',
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
