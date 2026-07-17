import { css } from '@styled/css';

// Side by side on wide viewports, stacked on narrow ones — mirrors how the
// image-row rich-text block lays out its own pair of cells.
export const root = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '4',
});

export const cell = css({
  flex: '[1 1 240px]',
  minWidth: '0',
});
