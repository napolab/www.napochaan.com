import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'element',
});

export const heading = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  letterSpacing: 'wider',
  textTransform: 'uppercase',
  color: 'fg.subtle',
});

// Vertical stack of rows; hairline between each row via borderBottom on items.
export const list = css({
  listStyle: 'none',
  margin: '0',
  padding: '0',
  display: 'flex',
  flexDirection: 'column',
});

// Row link: fixed thumb on the left, body column on the right.
export const item = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'element',
  paddingBlock: 'inline',
  borderBottomWidth: 'hairline',
  borderBottomStyle: 'solid',
  borderBottomColor: 'border.default',
  textDecorationLine: 'none',
  color: 'fg.default',
  transitionProperty: '[color]',
  transitionDuration: 'fast',
  transitionTimingFunction: 'stepSnap',
});

// Fixed-square thumb; flexShrink:0 prevents it from collapsing under long titles.
export const thumb = css({
  flexShrink: '0',
  width: '[64px]',
  height: '[64px]',
  objectFit: 'cover',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.default',
});

// Same fixed square but filled with the muted surface tone when no image exists.
export const thumbPlaceholder = css({
  flexShrink: '0',
  width: '[64px]',
  height: '[64px]',
  bg: 'bg.muted',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.default',
});

// Body column: stacks title above type, vertically centred with the thumb.
export const body = css({
  flex: '1',
  minWidth: '0',
  display: 'flex',
  flexDirection: 'column',
  gap: '[2px]',
});

// Layout only — colour + underline come from the `link` recipe applied alongside
// this class.  flex:1 + minWidth:0 let long titles truncate cleanly.
export const title = css({
  flex: '1',
  minWidth: '0',
  fontFamily: 'body',
  fontSize: 'sm',
  // 2-line mobile clamp is handled inside ScrambleText (`clamp`) so the ghost
  // reserves the height and the in-view scramble can't shift the row.
});

export const type = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  letterSpacing: 'wide',
  textTransform: 'uppercase',
  color: 'fg.muted',
});
