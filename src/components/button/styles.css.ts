import { cva } from '@styled/css';

export const button = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'inline',
    minH: 'targetComfortable',
    px: '4',
    fontFamily: 'mono',
    fontSize: 'sm',
    fontWeight: 'semibold',
    lineHeight: 'snug',
    borderWidth: 'default',
    borderStyle: 'solid',
    borderColor: 'fg.default',
    borderRadius: 'none',
    cursor: 'pointer',
    transitionProperty: '[transform,background-color,color]',
    transitionDuration: 'snap',
    transitionTimingFunction: 'stepSnap',
    _hover: { transform: 'translate(3px, 3px)' },
    _focusVisible: {
      outlineWidth: 'strong',
      outlineStyle: 'solid',
      outlineColor: 'border.focus',
      outlineOffset: '0.5',
    },
    _disabled: { opacity: 'disabled', cursor: 'not-allowed', _hover: { transform: 'none' } },
  },
  variants: {
    variant: {
      solid: {
        bg: 'accent.solid',
        color: 'fg.onSolid',
        borderColor: 'accent.solid',
        _hover: { bg: 'accent.solidHover' },
      },
      outline: { bg: 'transparent', color: 'fg.default' },
      danger: {
        bg: 'danger.solid',
        color: 'fg.onDanger',
        borderColor: 'danger.solid',
        _hover: { bg: 'danger.solidHover' },
      },
    },
  },
  defaultVariants: { variant: 'solid' },
});
