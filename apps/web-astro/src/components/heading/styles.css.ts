import { css } from '@styled/css';

export const root = css({
  fontFamily: 'display',
  fontWeight: 'normal',
  lineHeight: 'tight',
  color: 'fg.default',
  '&[data-level="1"]': { fontSize: 'h1', letterSpacing: 'tighter' },
  '&[data-level="2"]': { fontSize: 'h2', letterSpacing: 'tight' },
  '&[data-level="3"]': { fontSize: 'h3' },
  '&[data-level="4"]': { fontSize: 'xl' },
  '&[data-level="5"]': { fontSize: 'lg' },
  '&[data-level="6"]': { fontSize: 'md' },
});
