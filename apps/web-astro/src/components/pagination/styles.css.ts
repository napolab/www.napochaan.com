import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'inline',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
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

// Ledger cells: the Link supplies the resting muted colour (tone="muted"),
// no underline and no hover fill (fill={false}); this className only adds the
// per-state ledger treatment on top (hover shift to accent, inverted current bar).
export const link = css({
  ...cell,
  '&:not([data-current="true"])': {
    _hover: { color: 'accent.text', textDecorationLine: 'underline', textUnderlineOffset: '[2px]' },
  },
  // Current page adopts the sys-bar active treatment: inverted ink bar.
  '&[data-current="true"]': {
    color: 'fg.onSolid',
    bg: 'fg.default',
  },
});

export const step = css({
  ...cell,
  '&:not([data-disabled="true"])': {
    _hover: { color: 'accent.text' },
  },
  // Boundary step with nowhere to go: muted, non-interactive. The disabled step
  // renders as a <span> (no Link), so it owns its colour here.
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
