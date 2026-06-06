import { css } from '@styled/css';

export const root = css({
  position: 'relative',
  display: 'inline-block',
  fontFamily: 'display',
  fontStyle: 'italic',
  fontSize: 'hero',
  lineHeight: 'none',
  // Tighter than the `tighter` token to match prototype-v2's packed wordmark.
  letterSpacing: '[-0.06em]',
  // Keep the wordmark on one line — wide scramble glyphs must never wrap (the
  // stage's overflow-x: clip absorbs any transient width past the viewport).
  whiteSpace: 'nowrap',
});

// digibop ships only weight 400, so thicken the strokes with a same-color
// text-stroke to read bolder (matches prototype-v2's heavier wordmark).
export const fill = css({
  position: 'relative',
  zIndex: '[3]',
  color: 'fg.default',
  WebkitTextStroke: '[1.5px token(colors.fg.default)]',
});

export const echoBlue = css({
  position: 'absolute',
  inset: '0',
  color: 'accent.solid',
  WebkitTextStroke: '[1.5px token(colors.blue.9)]',
  transform: '[translate(10px,10px)]',
  zIndex: '[1]',
  userSelect: 'none',
  pointerEvents: 'none',
});

export const echoOut = css({
  position: 'absolute',
  inset: '0',
  color: 'transparent',
  WebkitTextStroke: '[2px token(colors.gray.12)]',
  transform: '[translate(20px,20px)]',
  zIndex: '[0]',
  userSelect: 'none',
  pointerEvents: 'none',
});

// Trailing accent period — upright (the wordmark is italic) and red.
export const red = css({
  color: 'danger.solid',
  fontStyle: 'normal',
});
