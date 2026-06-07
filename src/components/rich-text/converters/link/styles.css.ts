import { css } from '@styled/css';

// Rich-text body links do not scramble, so the saturated hover wash is their
// affordance. The rest of the site uses the scramble as the hover signal, so the
// shared Link recipe no longer ships this — it lives here, applied on top of the
// recipe via Link's className.
export const fillHover = css({
  _hover: { bg: 'accent.solid', color: 'fg.onSolid', textDecorationLine: 'none' },
});
