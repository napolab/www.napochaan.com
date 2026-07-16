import { css } from '@styled/css';

// Layout's <main> — mirrors the contact page's main wrapper.
export const main = css({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  gap: { base: '8', desktop: 'section' },
});

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'element',
});

export const heading = css({
  fontSize: 'lg',
  fontWeight: 'semibold',
  color: 'fg.default',
});
