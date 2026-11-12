import { css } from '@styled/css';

// Inline text format wrappers. Semibold so emphasis is never lighter than the
// semibold body weight some pages set (works / news / blog); accent colour carries
// the rest of the contrast.
export const strong = css({
  fontWeight: 'semibold',
  color: 'accent.text',
});

export const strike = css({
  color: 'danger.text',
  textDecorationLine: 'line-through',
});

export const inlineCode = css({
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
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
  _focusVisible: { layerStyle: 'focusRing' },
});
