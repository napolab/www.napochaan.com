import { css } from '@styled/css';

// Spine and dots share the same x (11px). The spine is drawn on the <ol> via _before;
// each dot is absolutely positioned at the same 11px (relative to the <li>, whose box-left
// equals the <ol> box-left) and centered on the line with translateX(-50%). This keeps the
// dot on the line regardless of item padding.
export const root = css({
  listStyle: 'none',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  _before: {
    content: '""',
    position: 'absolute',
    left: '[11px]',
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
  left: '[11px]',
  top: '[0.45em]',
  transform: '[translateX(-50%)]',
  width: '2',
  height: '2',
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
