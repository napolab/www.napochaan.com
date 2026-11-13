import { css } from '@styled/css';

export const root = css({
  color: 'fg.default',
  fontSize: 'md',
  // 1.7 (body) over 1.9 (jp): 1.9 reads too airy for running paragraphs.
  lineHeight: 'body',
});
