import { css } from '@styled/css';

export const field = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'inline',
});

// Mono micro-label — de-emphasised so the boxed input stays the focal point.
export const label = css({
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'sm',
  color: 'fg.muted',
});

// Boxed hairline input. Quiet at rest (paper background, gray hairline); the
// border lifts to accent on focus and to danger when react-aria marks it invalid.
export const input = css({
  width: 'full',
  paddingInline: 'element',
  paddingBlock: '2',
  fontFamily: 'body',
  fontSize: 'md',
  color: 'fg.default',
  bg: 'transparent',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.default',
  borderRadius: 'none',
  transitionProperty: '[border-color]',
  transitionDuration: 'fast',
  transitionTimingFunction: 'stepSnap',
  '&[data-focused]': { borderColor: 'accent.border' },
  '&[data-focus-visible]': { layerStyle: 'focusRing' },
  '&[data-invalid]': { borderColor: 'danger.border' },
  '&[aria-invalid="true"]': { borderColor: 'danger.border' },
  '@media (prefers-reduced-motion: reduce)': {
    transitionDuration: 'instant',
  },
});

export const error = css({
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'sm',
  color: 'danger.text',
});

export const description = css({
  fontSize: 'sm',
  color: 'fg.muted',
});
