import { css } from '@styled/css';

export const main = css({
  display: 'flex',
  flexDirection: 'column',
  // Fill the shell's flex column so the footer pins to the bottom of the fold on
  // short pages (see site-shell `stage`). Inert once content exceeds the viewport.
  flexGrow: 1,
  gap: { base: '8', desktop: 'section' },
});
