import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
});

// Three shared columns — date · category · title — so the tag and the title line
// up across all three rows, not just within a row (the archive uses the same
// subgrid). Defined on the list and inherited down to each row via `subgrid`.
export const log = css({
  display: 'grid',
  gridTemplateColumns: '[max-content max-content 1fr]',
  columnGap: 'inline',
});

// Mobile/tablet: a wrapping flex row — date + tag share line 1 and the title
// (flex-basis full) drops to line 2. Desktop adopts the 3-column subgrid so
// date · tag · title align across every row.
export const item = css({
  display: { base: 'flex', desktop: 'grid' },
  flexWrap: 'wrap',
  columnGap: 'inline',
  rowGap: '1',
  gridColumn: '[1 / -1]',
  gridTemplateColumns: '[subgrid]',
  // Mobile: date + tag share line 1, centred against each other. Desktop:
  // top-align so the meta sits on the title's first line (see `category`).
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
// that first line — level with the date and title — and keeps it on line 1 when
// the title wraps.
export const category = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '[1lh]',
  fontSize: 'md',
  lineHeight: 'snug',
});

// Plain (non-link) title — quiet ink for items without a destination.
export const title = css({
  justifySelf: 'start',
  maxWidth: 'full',
  fontFamily: 'body',
  fontSize: 'md',
  lineHeight: 'snug',
  color: 'fg.default',
  // Mobile/tablet: full basis forces the title onto its own line below date+tag.
  flexBasis: { base: 'full', desktop: '[auto]' },
});

// Linked title in the inline link colour (accent.text). The scramble is the only
// hover affordance — no background fill. Hug the text so the focus ring tracks it.
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
