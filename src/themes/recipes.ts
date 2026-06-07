import { defineRecipe } from '@pandacss/dev';

// Variant-driven inline link. A config recipe (not an atomic `cva`) so Panda
// generates every variant up-front — the variants are chosen at runtime via the
// Link component's props, which an atomic recipe's static analysis cannot see.
//
// `tone` picks the text colour and `underline` toggles the resting underline.
// The hover affordance site-wide is the scramble, so the recipe has no hover
// treatment of its own (the one exception — rich-text body links, which don't
// scramble — adds its saturated hover via a local style).
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
    focusRing: true,
  },
});
