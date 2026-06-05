import { css } from '@styled/css';

export const root = css({
  color: 'accent.text',
  textDecorationLine: 'underline',
  textUnderlineOffset: '[2px]',
  borderRadius: 'none',
  transitionProperty: '[background-color,color]',
  transitionDuration: 'fast',
  transitionTimingFunction: 'stepSnap',
  _hover: {
    bg: 'accent.solid',
    color: 'fg.onSolid',
    textDecorationLine: 'none',
  },
  _focusVisible: {
    outlineWidth: 'strong',
    outlineStyle: 'solid',
    outlineColor: 'border.focus',
    outlineOffset: '0.5',
  },
});
