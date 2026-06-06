import { css } from '@styled/css';

export const root = css({
  position: 'relative',
  display: 'inline-block',
  fontFamily: 'display',
  fontStyle: 'italic',
  fontSize: 'hero',
  lineHeight: 'none',
  letterSpacing: 'tighter',
  // Keep the wordmark on one line — wide scramble glyphs must never wrap (the
  // stage's overflow-x: clip absorbs any transient width past the viewport).
  whiteSpace: 'nowrap',
});

export const fill = css({
  position: 'relative',
  zIndex: '[3]',
  color: 'fg.default',
});

export const echoBlue = css({
  position: 'absolute',
  inset: '0',
  color: 'accent.solid',
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
