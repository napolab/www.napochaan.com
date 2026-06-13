import { css } from '@styled/css';

// Two stacked blocks: the section nav, then the copyright/meta row. The top
// border separates the footer from the last page section on the section rhythm.
export const root = css({
  marginBlockStart: { base: '8', desktop: 'section' },
  borderTopWidth: 'default',
  borderTopStyle: 'solid',
  borderTopColor: 'fg.default',
  paddingBlock: 'element',
  display: 'flex',
  flexDirection: 'column',
  gap: 'element',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'xs',
  color: 'fg.muted',
});

// Section links. Wraps to multiple lines on narrow widths so every section stays
// reachable at the foot of the page (the SysBar scrolls away above).
export const nav = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 'inline',
});

// Each link draws its own leading "·" via ::before so the separator is CSS, never
// JSX. The first item suppresses it.
export const navLink = css({
  _before: {
    content: '"·"',
    marginInlineEnd: 'inline',
    color: 'fg.subtle',
  },
  '&:first-child': {
    _before: { content: '""', marginInlineEnd: '0' },
  },
});

// copyright + meta: the original single space-between row, dropping to a column
// only when the width can't hold both ends (mirrors blog-nav's pager row→column).
// Separated from the nav above by a hairline.
export const meta = css({
  display: 'flex',
  flexDirection: { base: 'column', desktop: 'row' },
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 'inline',
  borderTopWidth: 'hairline',
  borderTopStyle: 'solid',
  borderTopColor: 'border.default',
  paddingTop: 'element',
});

export const status = css({
  display: 'flex',
  gap: 'inline',
});

export const live = css({
  color: 'accent.text',
});

// sitemap.xml is an XML resource, not a routable page, so it renders as a plain
// `<a>` (full navigation) rather than the react-aria Link. Mirror the muted footer
// link affordance AND the link recipe's resting underline (offset 2px) so it reads
// as a link at a glance, like the colophon Link beside it; accent on hover/focus.
export const sitemap = css({
  color: 'fg.muted',
  textDecorationLine: 'underline',
  textUnderlineOffset: '[2px]',
  '&:hover': { color: 'accent.text' },
  '&:focus-visible': { color: 'accent.text' },
});
