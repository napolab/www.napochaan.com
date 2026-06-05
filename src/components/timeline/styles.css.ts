import { css } from '@styled/css';

// The dot is an in-flow flex child centered by the row via `align-items: center` — no absolute
// positioning, top calc, or optical nudge needed. The spine is drawn behind the row via the
// <ol> _before at the dot's center x (half the dot width). The dot sits above the spine
// (position: relative + z-index) so hollow dots mask the line behind them.
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
  alignItems: 'center',
  gap: '3',
});

export const dot = css({
  position: 'relative',
  zIndex: '[1]',
  flexShrink: '0',
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
