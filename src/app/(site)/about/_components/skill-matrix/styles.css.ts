import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'element',
  containerType: 'inline-size',
});

// Stacks label-over-chips on narrow containers; promotes to a label-left row
// once there is room, so the matrix reads as aligned categories on desktop.
export const row = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'inline',
  '@container (min-width: 32rem)': {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
});

export const term = css({
  flex: 'none',
  fontFamily: 'mono',
  fontSize: 'xs',
  letterSpacing: 'wide',
  textTransform: 'uppercase',
  // fg.muted (≥4.5:1 vs canvas); fg.subtle was 4.03 and failed AA at this size.
  color: 'fg.muted',
  '@container (min-width: 32rem)': {
    width: '[9ch]',
  },
});

export const description = css({
  flex: '1',
  margin: '0',
});
