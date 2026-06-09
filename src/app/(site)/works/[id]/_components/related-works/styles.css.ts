import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'element',
});

export const heading = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  letterSpacing: 'wider',
  textTransform: 'uppercase',
  color: 'fg.subtle',
});

export const list = css({
  listStyle: 'none',
  margin: '0',
  padding: '0',
  display: 'grid',
  gridTemplateColumns: { base: '[1fr]', tablet: '[repeat(3, 1fr)]' },
  gap: 'element',
});

// Card link: full-colour thumb above the title + type.
export const item = css({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: 'inline',
  paddingBlock: 'inline',
  textDecorationLine: 'none',
  color: 'fg.default',
  transitionProperty: '[color]',
  transitionDuration: 'fast',
  transitionTimingFunction: 'stepSnap',
});

export const thumb = css({
  width: 'full',
  aspectRatio: '[1 / 1]',
  objectFit: 'cover',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.default',
});

export const thumbPlaceholder = css({
  width: 'full',
  aspectRatio: '[1 / 1]',
  bg: 'bg.muted',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.default',
});

export const title = css({
  fontFamily: 'body',
  fontSize: 'sm',
});

export const type = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  letterSpacing: 'wide',
  textTransform: 'uppercase',
  color: 'fg.muted',
});
