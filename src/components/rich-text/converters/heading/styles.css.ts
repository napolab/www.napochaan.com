import { css } from '@styled/css';

// Rich-text body headings (article h2/h3) read better in the body face than the
// loud digibop display font the Heading primitive defaults to. Scoped to
// [data-level] (0-2-0) so it outranks Heading's base `fontFamily: display`.
export const heading = css({
  // Section break lives ABOVE the heading: `section` (48px) top vs `element`
  // (12px) bottom keeps the heading grouped with the body that follows while
  // standing it well off from the previous block. Collapses with the prior
  // paragraph's bottom margin, so the gap is 48px (not additive). `:first-child`
  // drops the leading gap at the top of the article; `:last-child` mirrors the
  // other converters.
  marginBlockStart: 'section',
  marginBlockEnd: 'element',
  '&:first-child': { marginBlockStart: '0' },
  '&:last-child': { marginBlockEnd: '0' },
  // `[data-level]` (presence) keeps the 0-2-0 specificity across every level in a
  // single rule — Heading always renders data-level.
  '&[data-level]': { fontFamily: 'body' },
});
