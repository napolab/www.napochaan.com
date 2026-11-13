import { css } from '@styled/css';

export const paragraph = css({
  // `inline` (8px): a tight paragraph rhythm so consecutive paragraphs read as one
  // flowing passage. The lineHeight is already 1.7, so a small margin is enough to
  // separate blocks; anything larger competes with the heading's `block` (24px)
  // breaks and flattens the hierarchy. Section breaks are carried by the heading
  // margins, not by widening every paragraph gap.
  marginBlockEnd: 'inline',
  '&:last-child': { marginBlockEnd: '0' },
});
