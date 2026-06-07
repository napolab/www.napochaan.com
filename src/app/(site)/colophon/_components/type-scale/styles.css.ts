import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
});

export const row = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'inline',
  paddingBlock: 'element',
  borderBottomWidth: 'hairline',
  borderBottomStyle: 'solid',
  borderBottomColor: 'border.subtle',
});

// The size specimen — decorative (aria-hidden); the meaning lives in the meta.
export const specimen = css({
  fontFamily: 'display',
  lineHeight: 'none',
  color: 'fg.default',
  overflow: 'hidden',
  '&[data-token="md"]': { fontSize: 'md' },
  '&[data-token="h3"]': { fontSize: 'h3' },
  '&[data-token="h2"]': { fontSize: 'h2' },
  '&[data-token="h1"]': { fontSize: 'h1' },
  '&[data-token="display"]': { fontSize: 'display' },
  '&[data-token="hero"]': { fontSize: 'hero' },
});

export const meta = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'element',
  alignItems: 'baseline',
});

export const token = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  letterSpacing: 'wide',
  textTransform: 'uppercase',
  color: 'accent.text',
});

export const figure = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  color: 'fg.muted',
});

export const role = css({
  fontFamily: 'body',
  fontSize: 'sm',
  color: 'fg.default',
});
