import { css } from '@styled/css';

export const root = css({
  display: 'inline-flex',
  alignItems: 'center',
  px: '2',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: '2xs',
  lineHeight: 'snug',
  letterSpacing: 'wide',
  borderRadius: 'pill',
  whiteSpace: 'nowrap',
  '&[data-tone="default"]': {
    bg: 'fg.default',
    color: 'fg.onSolid',
  },
  '&[data-tone="blue"]': {
    bg: 'accent.solid',
    color: 'fg.onSolid',
  },
  '&[data-tone="outline"]': {
    bg: 'transparent',
    color: 'fg.default',
    borderWidth: 'hairline',
    borderStyle: 'solid',
    borderColor: 'fg.default',
  },
});
