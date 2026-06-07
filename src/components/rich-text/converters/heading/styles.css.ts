import { css } from '@styled/css';

// Rich-text body headings (article h2/h3) read better in the body face than the
// loud digibop display font the Heading primitive defaults to. Scoped to
// [data-level] (0-2-0) so it outranks Heading's base `fontFamily: display`.
export const heading = css({
  '&[data-level="1"]': { fontFamily: 'body' },
  '&[data-level="2"]': { fontFamily: 'body' },
  '&[data-level="3"]': { fontFamily: 'body' },
  '&[data-level="4"]': { fontFamily: 'body' },
  '&[data-level="5"]': { fontFamily: 'body' },
  '&[data-level="6"]': { fontFamily: 'body' },
});
