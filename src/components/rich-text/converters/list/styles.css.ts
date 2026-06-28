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
  // A wrapper item only holds a nested list: skip its number and its marker.
  '& > li[data-has-sublist]': { counterIncrement: 'none' },
  '& > li[data-has-sublist]::before': { content: 'none' },
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
  // A wrapper item only holds a nested list: skip its marker (placed last to win specificity ties).
  '& > li[data-has-sublist]::before': { content: 'none' },
});

export const listItem = css({
  position: 'relative',
  lineHeight: 'jp',
  marginBlockEnd: '2',
  '&:last-child': { marginBlockEnd: '0' },
  // The nested list owns its own spacing — the wrapper adds none of its own.
  '&[data-has-sublist]': { marginBlockEnd: '0' },
});
