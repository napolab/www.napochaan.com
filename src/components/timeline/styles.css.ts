import { css } from '@styled/css';

// Spine and dots share the same x: the gutter center = half of the item's padding-left
// (var(--spacing-6) / 2), so they stay aligned if the padding token changes. The spine is
// drawn on the <ol> via _before; each dot is absolutely positioned relative to its <li> with
// left = gutter-center - half-dot, and top = (1lh - dot) / 2 (centers on the first line —
// robust for multi-line items).
export const root = css({
  listStyle: 'none',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  _before: {
    content: '""',
    position: 'absolute',
    left: '[calc(var(--spacing-6) / 2 - 0.5px)]',
    top: '0',
    bottom: '0',
    width: '[1px]',
    bg: 'border.default',
  },
});

export const item = css({
  position: 'relative',
  display: 'flex',
  alignItems: 'baseline',
  gap: '3',
  pl: '6',
});

export const dot = css({
  position: 'absolute',
  left: '[calc(var(--spacing-6) / 2 - var(--sizes-2) / 2)]',
  top: '[calc((1lh - var(--sizes-2)) / 2)]',
  width: '2',
  height: '2',
  fontSize: 'sm',
  lineHeight: 'jp',
  borderRadius: 'pill',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.strong',
  bg: 'bg.canvas',
  flexShrink: '0',
  '&[data-upcoming="true"]': {
    bg: 'accent.solid',
    borderColor: 'accent.solid',
  },
});

export const date = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  lineHeight: 'snug',
  color: 'fg.muted',
  flexShrink: '0',
  '&[data-upcoming="true"]': {
    color: 'accent.text',
  },
});

export const label = css({
  fontFamily: 'body',
  fontSize: 'sm',
  lineHeight: 'jp',
  color: 'fg.default',
  '&[data-upcoming="true"]': {
    color: 'accent.text',
  },
});

export const meta = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  lineHeight: 'snug',
  color: 'fg.muted',
});
