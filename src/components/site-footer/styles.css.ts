import { css } from '@styled/css';

export const root = css({
  // The footer is a sibling of the page <main> in the shell's normal flow with
  // no gap between them, so without this its top border would hug the last
  // section on every page. Separate it on the section rhythm.
  marginBlockStart: { base: '8', desktop: 'section' },
  borderTopWidth: 'default',
  borderTopStyle: 'solid',
  borderTopColor: 'fg.default',
  paddingBlock: 'element',
  display: 'flex',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 'inline',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'xs',
  color: 'fg.muted',
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
// link affordance: inherit the mono/muted footer type, accent on hover/focus.
export const sitemap = css({
  color: 'fg.muted',
  textDecoration: 'none',
  '&:hover': { color: 'accent.text' },
  '&:focus-visible': { color: 'accent.text' },
});
