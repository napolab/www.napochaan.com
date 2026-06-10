import { css } from '@styled/css';

export const paragraph = css({
  // `element` (12px) over `block` (24px): with lineHeight 1.7 the larger gap read
  // too airy between single-line paragraphs. Section breaks are carried by the
  // heading's top margin instead, not by widening every paragraph gap.
  marginBlockEnd: 'element',
  '&:last-child': { marginBlockEnd: '0' },
});
