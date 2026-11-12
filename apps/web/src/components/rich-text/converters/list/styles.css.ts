import { css } from '@styled/css';

// Lists — preflight strips markers so we restore them via pseudo-elements
export const orderedList = css({
  listStyleType: 'none',
  counterReset: 'rt-list',
  paddingInlineStart: '8',
  marginBlockEnd: 'block',
  '&:last-child': { marginBlockEnd: '0' },
  '&[data-nested]': { marginBlockStart: '2', marginBlockEnd: '0', paddingInlineStart: '6' },
  // Markers belong to leaf items only. A wrapper item (one that only holds a nested
  // list) is excluded via :not — so it neither numbers nor increments the counter.
  '& > li:not([data-has-sublist])': { counterIncrement: 'rt-list' },
  '& > li:not([data-has-sublist])::before': {
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
  // Markers belong to leaf items only — wrapper items (holding just a nested list)
  // are excluded via :not. The same ▸ is used at every depth (like the ol numbers);
  // nesting is conveyed by indentation alone, not by switching the glyph.
  '& > li:not([data-has-sublist])::before': {
    content: '"▸"',
    position: 'absolute',
    insetInlineStart: '-5',
    color: 'accent.text',
    fontWeight: 'medium',
  },
});

export const listItem = css({
  position: 'relative',
  lineHeight: 'jp',
  marginBlockEnd: '2',
  '&:last-child': { marginBlockEnd: '0' },
  // The nested list owns its own spacing — the wrapper adds none of its own.
  '&[data-has-sublist]': { marginBlockEnd: '0' },
});
