import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
});

export const log = css({
  display: 'flex',
  flexDirection: 'column',
});

export const item = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  gap: 'inline',
  paddingBlock: 'element',
  borderBottomWidth: 'hairline',
  borderBottomStyle: 'dashed',
  borderBottomColor: 'border.subtle',
  '&:last-child': { borderBottomWidth: 'none' },
});

export const date = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  letterSpacing: 'wide',
  color: 'accent.text',
});

// Plain (non-link) title — quiet ink for items without a destination.
export const title = css({
  fontFamily: 'body',
  fontSize: 'md',
  lineHeight: 'snug',
  color: 'fg.default',
});

// Linked title in the inline link colour (accent.text). The scramble is the only
// hover affordance — no background fill. Hug the text so the focus ring tracks it.
export const titleLink = css({
  alignSelf: 'start',
  maxWidth: 'full',
  fontFamily: 'body',
  fontSize: 'md',
  lineHeight: 'snug',
});
