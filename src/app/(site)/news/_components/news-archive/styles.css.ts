import { css } from '@styled/css';

// Three shared columns — date · category · title — defined once on the root and
// inherited down through every level (root → group → ol → row) via `subgrid`, so
// each cell lines up across all rows and all month groups, not just within a row.
export const root = css({
  display: 'grid',
  gridTemplateColumns: '[max-content max-content 1fr]',
  columnGap: 'inline',
  rowGap: 'block',
});

export const group = css({
  display: 'grid',
  gridColumn: '[1 / -1]',
  gridTemplateColumns: '[subgrid]',
  rowGap: 'element',
});

// Year-month heading — spans all three columns.
export const month = css({
  gridColumn: '[1 / -1]',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'sm',
  letterSpacing: 'wide',
  // fg.muted (≥4.5:1 vs canvas); fg.subtle was 4.03 and failed AA at this size.
  color: 'fg.muted',
});

export const rows = css({
  display: 'grid',
  gridColumn: '[1 / -1]',
  gridTemplateColumns: '[subgrid]',
  // Rows sit flush; the dashed border + paddingBlock provide the separation, so
  // override the row-gap the root would otherwise pass down.
  rowGap: '0',
});

// Mobile/tablet: a wrapping flex row — date + category sit on line 1 and the
// title (flex-basis full) drops to line 2. Desktop keeps the aligned 3-column
// subgrid so date · category · title line up across every row and month group.
export const row = css({
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

// The tag's grid cell, centred in the (max-content = widest tag) category column.
// The outline pill is shorter than the row's text line, so the row's `start`
// alignment left it sitting ~3px above the date and title. Making the cell a flex
// box exactly one line tall (md/snug = the title's line box) centres the pill on
// that first line — level with the date and title — and, because the height is
// pinned to a single line, it stays on line 1 even when the title wraps.
// (`baseline` / `alignSelf: center` instead drift to the title's last/middle line.)
export const category = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '[1lh]',
  fontSize: 'md',
  lineHeight: 'snug',
});

// Title link in the inline link colour (accent.text). The scramble is the only
// hover affordance — no background fill — so hug the text (start-aligned, capped
// at the column width so long titles still wrap) and reserve the focus ring.
export const title = css({
  justifySelf: 'start',
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
