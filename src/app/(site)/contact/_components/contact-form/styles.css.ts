import { css } from '@styled/css';

export const form = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
});

export const actions = css({
  display: 'flex',
  justifyContent: 'flex-end',
});

// General (non-field) error banner — danger left bar marks the whole-form failure.
export const formError = css({
  paddingLeft: 'element',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'sm',
  color: 'danger.text',
  borderLeftWidth: 'strong',
  borderLeftStyle: 'solid',
  borderLeftColor: 'danger.solid',
});

// Calm confirmation block — accent left bar, mono copy, generous padding.
export const success = css({
  padding: 'block',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'md',
  color: 'fg.default',
  borderLeftWidth: 'strong',
  borderLeftStyle: 'solid',
  borderLeftColor: 'accent.border',
});
