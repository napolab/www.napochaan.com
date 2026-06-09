import { css } from '@styled/css';

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
    fontVariationSettings: '"wght" 600',
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
