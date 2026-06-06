import { css } from '@styled/css';

// The <ol> defines two column tracks (date | content); each <li> is a subgrid row
// sharing those tracks, so the date column and content column align across every
// row regardless of date width. align-items: baseline keeps date/label on one
// baseline; the dot lives inline at the start of the date (vertical-align middle)
// and the spine is the <ol> ::before drawn at the dot's center x.
export const root = css({
  listStyle: 'none',
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: '[max-content 1fr]',
  rowGap: '4',
  columnGap: '3',
  // 2px accent axis (not a thin gray line) so it reads as the deliberate timeline
  // spine rather than a misaligned background grid line. Paler blue than the dots
  // so the vivid dots stand out against it.
  _before: {
    content: '""',
    position: 'absolute',
    left: '[calc(var(--sizes-2) / 2 - 1px)]',
    top: '0',
    bottom: '0',
    width: '[2px]',
    bg: 'accent.border',
  },
});

export const item = css({
  display: 'grid',
  gridTemplateColumns: 'subgrid',
  gridColumn: '[span 2]',
  alignItems: 'baseline',
});

export const dot = css({
  display: 'inline-block',
  position: 'relative',
  zIndex: '[1]',
  marginRight: '2',
  width: '2',
  height: '2',
  borderRadius: 'pill',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.strong',
  bg: 'bg.canvas',
  '&[data-upcoming="true"]': {
    bg: 'accent.solid',
    borderColor: 'accent.solid',
  },
});

export const date = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  lineHeight: 'jp',
  color: 'fg.muted',
  '&[data-upcoming="true"]': {
    color: 'accent.text',
  },
});

// label + meta wrap together inside `content`; snug line-height keeps a wrapped
// meta line sitting tight under the label instead of floating (was jp = 1.9).
export const content = css({
  minWidth: '0',
  margin: '0',
  lineHeight: 'snug',
});

export const label = css({
  fontFamily: 'body',
  fontSize: 'sm',
  color: 'fg.default',
  '&[data-upcoming="true"]': {
    color: 'accent.text',
  },
});

export const meta = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  color: 'fg.muted',
  whiteSpace: 'nowrap',
});
