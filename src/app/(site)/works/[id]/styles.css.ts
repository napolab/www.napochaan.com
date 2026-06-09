import { css } from '@styled/css';

export const main = css({
  display: 'flex',
  flexDirection: 'column',
  gap: { base: '8', desktop: 'section' },
});

// Hairline rule between the work body and the related-works rail.
export const divider = css({
  border: 'none',
  borderTopWidth: 'hairline',
  borderTopStyle: 'solid',
  borderTopColor: 'border.default',
  margin: '0',
});
