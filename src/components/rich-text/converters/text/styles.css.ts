import { css } from '@styled/css';

// Inline text format wrappers
export const strong = css({
  fontWeight: 'medium',
  color: 'accent.text',
});

export const strike = css({
  color: 'danger.text',
  textDecorationLine: 'line-through',
});

export const inlineCode = css({
  fontFamily: 'mono',
  fontSize: '[0.875em]',
  bg: 'bg.subtle',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.subtle',
  px: '1',
  borderRadius: 'none',
  color: 'fg.default',
});

// Inline link inside rich text (auto-linked emails/URLs)
export const link = css({
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
