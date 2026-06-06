import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
});

// Contact-sheet thumbnail: small, grayscale "proof" so the index stays a quiet
// system table rather than a second gallery; colour blooms in on hover.
export const thumb = css({
  width: '[40px]',
  height: '[40px]',
  objectFit: 'cover',
  filter: '[grayscale(1) contrast(1.05)]',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.default',
  transitionProperty: '[filter]',
  transitionDuration: 'base',
  transitionTimingFunction: 'stepSnap',
  _hover: { filter: '[grayscale(0)]' },
});

export const thumbPlaceholder = css({
  display: 'inline-block',
  width: '[40px]',
  height: '[40px]',
  bg: 'bg.muted',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.default',
});
