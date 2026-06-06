import { css } from '@styled/css';

export const root = css({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
  // Desktop: an airy hero so the absolutely-positioned annotations have empty
  // space to sit in (the coords no longer overlap the buttons).
  minHeight: { base: '[auto]', desktop: '[58vh]' },
});

export const kicker = css({
  fontFamily: 'mono',
  fontSize: 'sm',
  lineHeight: 'snug',
  letterSpacing: 'wider',
  textTransform: 'uppercase',
  color: 'accent.text',
});

export const lead = css({
  fontFamily: 'body',
  // Smaller on mobile so the jump ratio against the large wordmark stays strong;
  // grows to lg on desktop.
  fontSize: { base: 'md', desktop: 'lg' },
  lineHeight: 'jp',
  color: 'fg.default',
  maxWidth: '[54ch]',
});

// Scattered decorative annotations are a desktop-only flourish — on mobile they
// would overlap the content/buttons.
export const annotationStart = css({
  display: { base: 'none', desktop: 'block' },
  position: 'absolute',
  top: 'section',
  right: 'page',
});

export const annotationEnd = css({
  display: { base: 'none', desktop: 'block' },
  position: 'absolute',
  bottom: 'section',
  right: 'page',
});

export const annotationCoords = css({
  display: { base: 'none', desktop: 'inline-flex' },
  position: 'absolute',
  bottom: '0',
  left: '0',
  alignItems: 'center',
  gap: '1',
});

const square = {
  display: 'inline-block',
  width: '[10px]',
  height: '[10px]',
  marginInlineStart: '1',
  verticalAlign: 'middle',
} as const;

export const squareBlue = css({ ...square, bg: 'accent.solid' });
export const squareRed = css({ ...square, bg: 'danger.solid' });

// Blinking terminal caret appended after the lead (paused under reduced-motion).
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

export const buttons = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'element',
});
