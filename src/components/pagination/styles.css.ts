import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'inline',
  fontFamily: 'mono',
  fontSize: 'sm',
});

// Shared cell sizing for every numbered/step item so the row reads as a ledger of
// even slots. Links and disabled steps both adopt this via composition.
const cell = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 'targetMin',
  minHeight: 'targetMin',
  paddingInline: '1.5',
  borderRadius: 'none',
} as const;

// These cells render as @components/link (which ships its own inline-link
// colour). Panda atomic classes don't honour class-attribute order, so a bare
// `color` would lose to Link's. The `:not([data-current])` / `:not([data-disabled])`
// selectors bump specificity to 0-2-0 (above Link's 0-1-0), so this className
// reliably overrides Link's colour back to the muted ledger treatment.
export const link = css({
  ...cell,
  textDecorationLine: 'none',
  transitionProperty: '[background-color,color]',
  transitionDuration: 'fast',
  transitionTimingFunction: 'stepSnap',
  _focusVisible: { layerStyle: 'focusRing' },
  '&:not([data-current="true"])': {
    color: 'fg.muted',
    _hover: {
      // Cancel @components/link's accent.solid hover fill — without this the blue
      // text would sit on a blue bar and vanish. The ledger hover is just the
      // text shifting to accent.
      bg: 'transparent',
      color: 'accent.text',
      textDecorationLine: 'underline',
      textUnderlineOffset: '[2px]',
    },
  },
  // Current page adopts the sys-bar active treatment: inverted ink bar.
  '&[data-current="true"]': {
    color: 'fg.onSolid',
    bg: 'fg.default',
    textDecorationLine: 'none',
  },
});

export const step = css({
  ...cell,
  textDecorationLine: 'none',
  transitionProperty: '[background-color,color]',
  transitionDuration: 'fast',
  transitionTimingFunction: 'stepSnap',
  _focusVisible: { layerStyle: 'focusRing' },
  '&:not([data-disabled="true"])': {
    color: 'fg.muted',
    _hover: { bg: 'transparent', color: 'accent.text' },
  },
  // Boundary step with nowhere to go: muted, non-interactive.
  '&[data-disabled="true"]': {
    color: 'fg.subtle',
    cursor: 'default',
    pointerEvents: 'none',
  },
});

export const ellipsis = css({
  ...cell,
  color: 'fg.subtle',
});
