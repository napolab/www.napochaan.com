import { css } from '@styled/css';

export const srOnly = css({ srOnly: true });

// The hidden sizer reserves the final wrapped height; the typed text overlays it
// absolutely so the typewriter (and its fumbles) never shift what sits below.
export const typeWrap = css({
  position: 'relative',
  display: 'block',
});

export const sizer = css({
  visibility: 'hidden',
});

export const typed = css({
  position: 'absolute',
  top: '0',
  left: '0',
  width: 'full',
});

// Blinking terminal caret appended after the text (paused under reduced-motion).
export const caret = css({
  _after: {
    content: '"_"',
    marginInlineStart: '0.5',
    color: 'accent.text',
    animationName: 'blink',
    animationDuration: '[1s]',
    animationTimingFunction: '[steps(1)]',
    animationIterationCount: 'infinite',
    _motionReduce: { animationName: '[none]' },
  },
});
