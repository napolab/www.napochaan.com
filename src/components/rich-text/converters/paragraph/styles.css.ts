import { css } from '@styled/css';

export const paragraph = css({
  marginBlockEnd: 'block',
  '&:last-child': { marginBlockEnd: '0' },
});
