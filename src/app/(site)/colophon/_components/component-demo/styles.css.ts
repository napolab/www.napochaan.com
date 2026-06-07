import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'element',
  padding: 'block',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.default',
});

export const name = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  letterSpacing: 'wide',
  textTransform: 'uppercase',
  color: 'accent.text',
});

export const why = css({
  margin: '0',
  fontFamily: 'body',
  fontSize: 'sm',
  lineHeight: 'body',
  color: 'fg.muted',
  maxWidth: '[60ch]',
});

// The live demo stage. overflow:hidden keeps wide demos (Marquee, hero type)
// from forcing horizontal page scroll.
export const stage = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'element',
  paddingBlock: 'element',
  overflow: 'hidden',
});
