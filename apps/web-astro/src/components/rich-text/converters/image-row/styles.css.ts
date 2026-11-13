import { css } from '@styled/css';

// Two cover figures side by side. The row is capped to 85% of the content column
// and centred — the same width as a standalone in-body figure — so single and
// paired images line up. On a narrow container the row scrolls horizontally (each
// cell is a fixed fraction of the visible width); once the container is wide enough
// the cells share the row equally. `marginBlock` matches the standalone figure
// spacing so an image-row sits apart from body text.
export const root = css({
  display: 'flex',
  gap: '4',
  overflowX: 'auto',
  containerType: 'inline-size',
  width: '[85%]',
  marginInline: '[auto]',
  marginBlock: '8',
});

// Default (narrow): a fixed fraction so a second cell peeks in, signalling the
// row scrolls. `minWidth: 0` lets the inner Figure shrink instead of overflowing.
// Once the container clears the breakpoint, both cells share the row evenly.
export const cellRoot = css({
  flex: '[0 0 78%]',
  minWidth: '0',
  '@container (min-width: 480px)': {
    flex: '[1 1 0]',
  },
});
