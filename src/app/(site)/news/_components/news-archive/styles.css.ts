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

export const row = css({
  display: 'grid',
  gridColumn: '[1 / -1]',
  gridTemplateColumns: '[subgrid]',
  alignItems: 'baseline',
  paddingBlock: 'element',
  borderBottomWidth: 'hairline',
  borderBottomStyle: 'dashed',
  borderBottomColor: 'border.subtle',
  '&:last-child': { borderBottomWidth: 'none' },
});

export const date = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  letterSpacing: 'wide',
  color: 'accent.text',
});

// Centre the tag within the (max-content = widest tag) category column so the
// shorter labels sit centred rather than ragged on the left.
export const category = css({
  justifySelf: 'center',
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
});
