import { css } from '@styled/css';

// TERMINAL-style blockquote: monospaced, muted, "> " prefix
export const blockquote = css({
  fontFamily: 'mono',
  fontSize: 'sm',
  color: 'fg.muted',
  paddingInlineStart: 'element',
  marginBlockEnd: 'block',
  '&:last-child': { marginBlockEnd: '0' },
  _before: {
    content: '"> "',
    color: 'accent.text',
    display: 'inline',
  },
});
