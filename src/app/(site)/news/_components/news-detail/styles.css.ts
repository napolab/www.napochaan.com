import { css } from '@styled/css';

// Short announcements get a minimum body height so the header and prev/next nav
// don't bunch at the top of the page.
// Medium so the (system-font) Japanese body reads a touch less thin; inherited by
// the RichText tree. Explicit-weight nodes (headings) are unaffected.
export const body = css({
  minHeight: '[40vh]',
  fontWeight: 'medium',
});
