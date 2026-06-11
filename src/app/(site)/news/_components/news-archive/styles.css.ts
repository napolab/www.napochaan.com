import { css } from '@styled/css';

// Three shared columns — date · category · title — defined once on the root and
// inherited down through every level (root → group → ol → row) via `subgrid`, so
// each cell lines up across all rows and all month groups, not just within a row.
// The per-row layout lives in the shared NewsRow component.
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
