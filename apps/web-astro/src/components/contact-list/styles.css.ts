import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'element',
  listStyle: 'none',
});

// Outline-button external link. Quiet at rest (black on paper, hairline border);
// the saturated accent is reserved for the hover lift. Sharp corners keep it
// aligned to the grid aesthetic.
export const link = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'inline',
  paddingInline: 'element',
  paddingBlock: '2',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'sm',
  textDecorationLine: 'none',
  color: 'fg.default',
  bg: 'transparent',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.default',
  borderRadius: 'none',
  transitionProperty: '[color,border-color]',
  transitionDuration: 'fast',
  transitionTimingFunction: 'stepSnap',
  _hover: {
    color: 'accent.text',
    borderColor: 'accent.border',
  },
  _focusVisible: { layerStyle: 'focusRing' },
  '@media (prefers-reduced-motion: reduce)': {
    transitionDuration: 'instant',
  },
});

// Platform label stays de-emphasised; the handle + ↗ inherit the link colour so
// they lift to accent together on hover.
export const label = css({
  color: 'fg.muted',
});

export const handle = css({
  fontWeight: 'medium',
});
