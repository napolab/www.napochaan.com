import { css } from '@styled/css';

// Rich-text body headings (article h2/h3) read better in the body face than the
// loud digibop display font the Heading primitive defaults to. Scoped to
// [data-level] (0-2-0) so it outranks Heading's base `fontFamily: display`.
export const heading = css({
  // `[data-level]` (presence) keeps the 0-2-0 specificity across every level in a
  // single rule — Heading always renders data-level.
  '&[data-level]': { fontFamily: 'body' },
});
