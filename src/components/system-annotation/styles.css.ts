import { css } from '@styled/css';

export const root = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  lineHeight: 'snug',
  letterSpacing: 'wide',
  '&[data-tone="muted"]': {
    color: 'fg.muted',
  },
  '&[data-tone="accent"]': {
    color: 'accent.text',
  },
  '&[data-tone="danger"]': {
    color: 'danger.text',
  },
});
