import { css } from '@styled/css';

// Rich-text body headings (article h2/h3) read better in the body face than the
// loud digibop display font the Heading primitive defaults to. Scoped to
// [data-level] (0-2-0) so it outranks Heading's base `fontFamily: display`.
export const heading = css({
  // In-body headings sit a rank BELOW the page title. The title block is set off
  // by the main `section` (48px) gap, so body headings use the smaller `block`
  // (24px) above to read as subordinate to the title rather than its peer; `block`
  // (24px) below pairs the heading with the content that follows. The top
  // collapses with the prior paragraph's `element` (12px) bottom margin, so the
  // gap above resolves to 24px (not additive). `:first-child` drops the leading
  // gap at the top of the article; `:last-child` mirrors the other converters.
  // The gutter copy-anchor (HeadingAnchor) is absolutely positioned against the
  // heading and reveals itself by reading the inheriting `--anchor-opacity`
  // custom property — 0 at rest, raised on hover / keyboard focus. A descendant
  // selector (`.heading:hover .anchor`) is disallowed by the no-child-selectors
  // rule, so the heading publishes the value and the anchor consumes it. Coarse
  // pointers have no hover, so the baseline is raised to keep it discoverable.
  position: 'relative',
  scrollMarginBlockStart: 'section',
  '--anchor-opacity': '0',
  '&:hover': { '--anchor-opacity': '1' },
  '&:focus-within': { '--anchor-opacity': '1' },
  '@media (pointer: coarse)': { '--anchor-opacity': '0.4' },
  marginBlockStart: 'block',
  marginBlockEnd: 'block',
  '&:first-child': { marginBlockStart: '0' },
  '&:last-child': { marginBlockEnd: '0' },
  // h3 and deeper are subsections, not section breaks: a smaller bottom margin
  // (`element` 12px vs the h1/h2 `block` 24px) binds them tighter to the content
  // they introduce, so the heading scale reads as a hierarchy rather than a flat
  // set of equally-spaced rules.
  '&:is([data-level="3"], [data-level="4"], [data-level="5"], [data-level="6"])': { marginBlockEnd: 'element' },
  // `[data-level]` (presence) keeps the 0-2-0 specificity across every level in a
  // single rule — Heading always renders data-level. The body face wants tighter
  // tracking than the Heading primitive's display-tuned defaults (h3+ ship at 0),
  // so pull every level in to `tight`. No explicit `fontWeight`: the body stack
  // already renders Latin bold (the prepended 700 mplus1En) while Japanese stays
  // normal — setting a weight here would thicken the JP glyphs too (the per-script
  // split we deliberately avoid). Pure `black` ink + the larger size carry the
  // heading above the body prose without reaching the page title's heft.
  '&[data-level]': { fontFamily: 'body', letterSpacing: 'tight', color: 'black' },
});
