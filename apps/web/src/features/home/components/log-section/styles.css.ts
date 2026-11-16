import { css } from '@styled/css';

// Below the fold: rendering deferred until it nears the viewport (belowFold
// utility; value = measured mobile 412 / desktop 1280 height).
// The heading link sits ~1px under the section top, so its focus ring would be cut by
// the deferral's paint clip in WebKit (no overflow-clip-margin there): an 8px block
// padding cancelled by an 8px negative margin moves the clip edge out without moving
// anything, and the anchor offset drops by the same 8px so #log still lands where it did.
export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
  belowFold: { base: '341px', desktop: '265px' },
  paddingBlock: '2',
  marginBlock: '-2',
  scrollMarginTop: '[calc(var(--band-top) + token(spacing.4))]',
});
