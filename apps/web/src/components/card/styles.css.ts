import { css } from '@styled/css';

export const root = css({
  display: 'block',
  bg: 'bg.canvas',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'fg.default',
  borderRadius: 'none',
  p: 'element',
  transitionProperty: '[outline-color]',
  transitionDuration: 'fast',
  transitionTimingFunction: 'stepSnap',
  _hover: {
    outlineWidth: 'strong',
    outlineStyle: 'solid',
    outlineColor: 'accent.solid',
    outlineOffset: '[-3px]',
  },
});
