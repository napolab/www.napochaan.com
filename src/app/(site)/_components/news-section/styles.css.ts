import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
});

// Three shared columns — date · category · title — so the tag and the title line
// up across all rows, not just within a row (the archive uses the same subgrid).
// Defined on the list and inherited down to each row via `subgrid`. The per-row
// layout lives in the shared NewsRow component.
export const log = css({
  display: 'grid',
  gridTemplateColumns: '[max-content max-content 1fr]',
  columnGap: 'inline',
});
