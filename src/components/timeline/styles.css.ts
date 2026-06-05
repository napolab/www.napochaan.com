import { css } from '@styled/css';

// Rows use align-items: baseline so the date and label share a text baseline. The dot lives
// INLINE at the start of the date with vertical-align: middle, so its center sits on the text's
// x-height center (line-height-independent, unlike box centering). The spine is drawn behind via
// the <ol> _before at the dot's center x (half the dot width); the dot has z-index so hollow
// dots mask the line behind them.
export const root = css({
  listStyle: 'none',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  _before: {
    content: '""',
    position: 'absolute',
    left: '[calc(var(--sizes-2) / 2 - 0.5px)]',
    top: '0',
    bottom: '0',
    width: '[1px]',
    bg: 'border.default',
  },
});

export const item = css({
  display: 'flex',
  alignItems: 'baseline',
  gap: '3',
});

export const dot = css({
  display: 'inline-block',
  verticalAlign: 'middle',
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
  flexShrink: '0',
  fontFamily: 'mono',
  fontSize: 'xs',
  lineHeight: 'jp',
  color: 'fg.muted',
  '&[data-upcoming="true"]': {
    color: 'accent.text',
  },
});

// label + meta live inside `content` as INLINE text so they wrap together as one block;
// `date` stays a fixed column.
export const content = css({
  flex: '1',
  minWidth: '0',
  margin: '0',
  lineHeight: 'jp',
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
