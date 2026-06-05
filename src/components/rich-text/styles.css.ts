import { css } from '@styled/css';

export const root = css({
  color: 'fg.default',
  fontSize: 'md',
  lineHeight: 'jp',
});

export const paragraph = css({
  marginBlockEnd: 'block',
  '&:last-child': { marginBlockEnd: '0' },
});

// Inline text format wrappers
export const strong = css({
  fontWeight: 'medium',
  color: 'accent.text',
});

export const strike = css({
  color: 'danger.text',
  textDecorationLine: 'line-through',
});

export const inlineCode = css({
  fontFamily: 'mono',
  fontSize: '[0.875em]',
  bg: 'bg.subtle',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.subtle',
  px: '1',
  borderRadius: 'none',
  color: 'fg.default',
});

// Inline link inside rich text (auto-linked emails/URLs and authored links)
export const link = css({
  color: 'accent.text',
  textDecorationLine: 'underline',
  textUnderlineOffset: '[2px]',
  borderRadius: 'none',
  transitionProperty: '[background-color,color]',
  transitionDuration: 'fast',
  transitionTimingFunction: 'stepSnap',
  _hover: {
    bg: 'accent.solid',
    color: 'fg.onSolid',
    textDecorationLine: 'none',
  },
  _focusVisible: {
    outlineWidth: 'strong',
    outlineStyle: 'solid',
    outlineColor: 'border.focus',
    outlineOffset: '0.5',
  },
});

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

// Lists — preflight strips markers so we restore them via pseudo-elements
export const orderedList = css({
  listStyleType: 'none',
  counterReset: 'rt-list',
  paddingInlineStart: '8',
  marginBlockEnd: 'block',
  '&:last-child': { marginBlockEnd: '0' },
  '&[data-nested]': { marginBlockStart: '2', marginBlockEnd: '0', paddingInlineStart: '6' },
  '& > li': { counterIncrement: 'rt-list' },
  '& > li::before': {
    content: 'counter(rt-list) "."',
    position: 'absolute',
    insetInlineStart: '-8',
    width: '6',
    textAlign: 'right',
    color: 'accent.text',
    fontFamily: 'mono',
    fontWeight: 'medium',
  },
});

export const unorderedList = css({
  listStyleType: 'none',
  paddingInlineStart: '6',
  marginBlockEnd: 'block',
  '&:last-child': { marginBlockEnd: '0' },
  '&[data-nested]': { marginBlockStart: '2', marginBlockEnd: '0', paddingInlineStart: '5' },
  '& > li::before': {
    content: '"▸"',
    position: 'absolute',
    insetInlineStart: '-5',
    color: 'accent.text',
    fontWeight: 'medium',
  },
  '&[data-nested] > li::before': { content: '"·"', insetInlineStart: '-4' },
});

export const listItem = css({
  position: 'relative',
  lineHeight: 'jp',
  marginBlockEnd: '2',
  '&:last-child': { marginBlockEnd: '0' },
});

// Horizontal rule
export const hr = css({
  borderTopWidth: 'default',
  borderTopStyle: 'solid',
  borderTopColor: 'border.subtle',
  marginBlockEnd: 'block',
  '&:last-child': { marginBlockEnd: '0' },
});

// Table layout
export const tableScroll = css({
  overflowX: 'auto',
  marginBlockEnd: 'block',
  '&:last-child': { marginBlockEnd: '0' },
});

export const tableRoot = css({
  width: 'full',
  borderCollapse: 'collapse',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'fg.default',
  fontFamily: 'body',
  fontSize: 'sm',
  lineHeight: 'body',
});

export const headerCell = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  fontWeight: 'semibold',
  lineHeight: 'snug',
  letterSpacing: 'wide',
  textTransform: 'uppercase',
  color: 'fg.muted',
  textAlign: 'left',
  px: 'element',
  py: '2',
  borderBottomWidth: 'default',
  borderBottomStyle: 'solid',
  borderBottomColor: 'fg.default',
  bg: 'bg.subtle',
});

export const cell = css({
  px: 'element',
  py: '2',
  color: 'fg.default',
  verticalAlign: 'top',
  borderBottomWidth: 'hairline',
  borderBottomStyle: 'solid',
  borderBottomColor: 'border.subtle',
  '[data-row]:last-child &': { borderBottomWidth: 'none' },
  _groupHover: { bg: 'bg.subtle' },
});

export const tableRow = css({
  transitionProperty: '[background-color]',
  transitionDuration: 'fast',
  transitionTimingFunction: 'stepSnap',
  _hover: { bg: 'bg.subtle' },
  '&:last-child td': { borderBottomWidth: 'none' },
});
