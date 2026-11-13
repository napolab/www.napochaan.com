import { css } from '@styled/css';

export const root = css({
  overflow: 'hidden',
  borderBlockWidth: 'hairline',
  borderBlockStyle: 'solid',
  borderBlockColor: 'fg.default',
  bg: 'bg.canvas',
  pointerEvents: 'none',
  userSelect: 'none',
});

export const track = css({
  display: 'flex',
  width: 'max',
  animationName: 'marquee',
  animationDuration: '[18s]',
  animationTimingFunction: 'linear',
  animationIterationCount: 'infinite',
  _motionReduce: {
    animationName: '[none]',
  },
  '&[data-reverse="true"]': {
    animationDirection: 'reverse',
  },
});
