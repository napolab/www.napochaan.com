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

// Contact-sheet card link: a grayscale proof thumb above the title + type,
// blooming to colour on hover/focus. Mirrors the archive row treatment.
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
  filter: '[grayscale(1) contrast(1.05)]',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.default',
  transitionProperty: '[filter]',
  transitionDuration: 'base',
  transitionTimingFunction: 'stepSnap',
  _groupHover: { filter: '[grayscale(0)]' },
  _groupFocusVisible: { filter: '[grayscale(0)]' },
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
