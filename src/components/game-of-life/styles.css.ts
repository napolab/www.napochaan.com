import { css } from '@styled/css';

// position:fixed; inset: 24px (typography-band width); sits behind content at z-index base
export const root = css({
  position: 'fixed',
  inset: '[token(sizes.band)]',
  zIndex: 'base',
  pointerEvents: 'none',
});
