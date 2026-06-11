import { css } from '@styled/css';

// The parent list owns the three-column track (max-content · max-content · 1fr);
// each NewsRow inherits it via subgrid. Mirrors the home feed / news archive
// lists so the showcased rows line up exactly as they do in production.
export const list = css({
  display: 'grid',
  gridTemplateColumns: '[max-content max-content 1fr]',
  columnGap: 'inline',
  width: 'full',
});
