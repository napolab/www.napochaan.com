import { css } from '@styled/css';

export const main = css({
  display: 'flex',
  flexDirection: 'column',
  gap: { base: '8', desktop: 'section' },
});

// Short announcements get a minimum body height so the header and prev/next nav
// don't bunch at the top of the page.
export const body = css({
  minHeight: '[40vh]',
});
