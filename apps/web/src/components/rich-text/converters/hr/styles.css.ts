import { css } from '@styled/css';

// Horizontal rule
export const hr = css({
  borderTopWidth: 'default',
  borderTopStyle: 'solid',
  borderTopColor: 'border.subtle',
  marginBlockEnd: 'block',
  '&:last-child': { marginBlockEnd: '0' },
});
