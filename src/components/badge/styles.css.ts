import { css } from '@styled/css';

export const root = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'inline',
  fontFamily: 'mono',
  fontSize: 'xs',
  lineHeight: 'snug',
  color: 'fg.default',
});

export const dot = css({
  width: '2',
  height: '2',
  borderRadius: 'pill',
  flexShrink: '0',
  '&[data-tone="accent"]': {
    bg: 'accent.solid',
  },
  '&[data-tone="danger"]': {
    bg: 'danger.spot',
  },
  '&[data-tone="neutral"]': {
    bg: 'fg.muted',
  },
});
