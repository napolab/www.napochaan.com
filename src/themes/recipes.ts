import { defineRecipe } from '@pandacss/dev';

// Variant-driven inline link. A config recipe (not an atomic `cva`) so Panda
// generates every variant up-front — the variants are chosen at runtime via the
// Link component's props, which an atomic recipe's static analysis cannot see.
//
// `tone` picks the text colour, `underline` toggles the resting underline, and
// `fill` toggles the saturated hover wash (the legacy inline-link affordance) —
// turn it off where the site-wide scramble is the hover signal instead. Defaults
// reproduce the original fixed link (accent + underline + fill).
export const linkRecipe = defineRecipe({
  className: 'link',
  base: {
    borderRadius: 'none',
    transitionProperty: '[background-color,color]',
    transitionDuration: 'fast',
    transitionTimingFunction: 'stepSnap',
  },
  variants: {
    tone: {
      accent: { color: 'accent.text' },
      muted: { color: 'fg.muted' },
      default: { color: 'fg.default' },
      subtle: { color: 'fg.subtle' },
      inherit: { color: '[inherit]' },
    },
    underline: {
      true: { textDecorationLine: 'underline', textUnderlineOffset: '[2px]' },
      false: { textDecorationLine: 'none' },
    },
    fill: {
      true: { _hover: { bg: 'accent.solid', color: 'fg.onSolid', textDecorationLine: 'none' } },
      false: {},
    },
    // The shared focus ring. Turn off (`focusRing={false}`) for whole-card links
    // that draw their own inset indicator (clipped containers), so the two don't
    // double up.
    focusRing: {
      true: { _focusVisible: { layerStyle: 'focusRing' } },
      false: {},
    },
  },
  // A default-toned link is the same colour as body text, so the underline is its
  // only affordance — keep it underlined even when `underline={false}` is passed.
  compoundVariants: [
    {
      tone: 'default',
      css: { textDecorationLine: 'underline', textUnderlineOffset: '[2px]' },
    },
  ],
  defaultVariants: {
    tone: 'accent',
    underline: true,
    fill: true,
    focusRing: true,
  },
});
