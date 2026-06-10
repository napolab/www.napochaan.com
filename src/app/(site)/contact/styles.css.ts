import { css } from '@styled/css';

export const main = css({
  display: 'flex',
  flexDirection: 'column',
  // Fill the shell's flex column so the footer pins to the bottom of the fold on
  // short pages (see site-shell `stage`). Inert once content exceeds the viewport.
  flexGrow: 1,
  gap: { base: '8', desktop: 'section' },
});

// Desktop pairs the message form (wide) and the direct-contact aside (narrow)
// into a two-column grid; mobile stacks them with the aside below the form.
export const grid = css({
  display: 'grid',
  gap: { base: '8', desktop: 'section' },
  gridTemplateColumns: { base: '1fr', desktop: '2fr 1fr' },
});

export const formCell = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'element',
});

export const directCell = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'element',
});
