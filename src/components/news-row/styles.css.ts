import { css } from '@styled/css';

// One news row — date · category tag · title. The parent list owns the three
// shared columns (`max-content max-content 1fr`); the row inherits them via
// `subgrid` so date · tag · title line up across every row and group.
//
// Mobile/tablet: a wrapping flex row — date + tag share line 1 and the title
// (flex-basis full) drops to line 2. Desktop adopts the parent's 3-column subgrid.
export const root = css({
  display: { base: 'flex', desktop: 'grid' },
  flexWrap: 'wrap',
  columnGap: 'inline',
  // Tight gap between the date+tag line and the title line on mobile.
  rowGap: '1',
  gridColumn: '[1 / -1]',
  gridTemplateColumns: '[subgrid]',
  // Mobile: date + tag share line 1 and are vertically centred against each other.
  // Desktop: top-align (not baseline) — the title is an inline-block scramble whose
  // baseline is its *last* line, so `baseline` would drop the date + tag to the
  // title's second line; `start` pins them to the title's first line.
  alignItems: { base: 'center', desktop: 'start' },
  paddingBlock: 'element',
  borderBottomWidth: 'hairline',
  borderBottomStyle: 'dashed',
  borderBottomColor: 'border.subtle',
  '&:last-child': { borderBottomWidth: 'none' },
});

export const date = css({
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'xs',
  letterSpacing: 'wide',
  color: 'accent.text',
});

// The tag's grid cell. The outline pill is shorter than the row's text line, so
// the row's `start` alignment would leave it ~3px above the date and title. A flex
// cell exactly one line tall (md/snug = the title's line box) centres the pill on
// that first line — level with the date and title — and keeps it on line 1 when the
// title wraps. Left-aligned within the (max-content = widest tag) category column.
export const category = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'start',
  height: '[1lh]',
  fontSize: 'md',
  lineHeight: 'snug',
});

// Plain (non-link) title — quiet ink for rows without a destination.
export const title = css({
  justifySelf: 'start',
  alignSelf: 'start',
  maxWidth: 'full',
  fontFamily: 'body',
  fontSize: 'md',
  lineHeight: 'snug',
  color: 'fg.default',
  // Mobile/tablet: full basis forces the title onto its own line below date+tag.
  flexBasis: { base: 'full', desktop: '[auto]' },
});

// Linked title in the inline link colour (accent via Link tone). The scramble is
// the only hover affordance — no background fill — so hug the text and reserve the
// focus ring.
export const titleLink = css({
  justifySelf: 'start',
  alignSelf: 'start',
  maxWidth: 'full',
  fontFamily: 'body',
  fontSize: 'md',
  lineHeight: 'snug',
  // Mobile/tablet: full basis forces the title onto its own line below date+tag.
  flexBasis: { base: 'full', desktop: '[auto]' },
});

// Small trailing marker for links that open externally. aria-hidden — the new-tab
// behaviour is conveyed by target/rel, this is a purely visual cue.
export const externalMark = css({
  marginLeft: '1',
  fontSize: 'xs',
  color: 'accent.text',
});
