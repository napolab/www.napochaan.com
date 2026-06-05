import { css } from '@styled/css';

// DARK TERMINAL code block: ink bg, canvas text
export const codeBlock = css({
  fontFamily: 'mono',
  fontSize: 'sm',
  bg: 'fg.default',
  color: 'bg.canvas',
  p: 'element',
  borderRadius: 'none',
  overflowX: 'auto',
  marginBlockEnd: 'block',
  '&:last-child': { marginBlockEnd: '0' },
});
