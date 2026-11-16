import { css } from '@styled/css';

// Below the fold: rendering deferred until it nears the viewport (belowFold
// utility). The value is the measured height with five rows (mobile 412 /
// desktop 1280) — a reservation only; the real size replaces it once rendered.
export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
  belowFold: { base: '481px', desktop: '310px' },
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
