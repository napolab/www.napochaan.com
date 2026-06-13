import { css } from '@styled/css';

// Parks the copy button in the heading's left gutter: `insetInlineEnd: 100%` puts its
// right edge at the text's left edge (entirely in the gutter, scaling with the
// heading), vertically centered on the first line via `top: 0.5lh` +
// `translateY(-50%)` (it inherits the heading line-height, so `lh` resolves to the
// heading's line box). Revealed by the heading's inheriting `--anchor-opacity` (set
// on hover / focus-within there) — no descendant selector. `var()` opacity, the
// transition, transform and offset are strictTokens escape-hatch values.
export const root = css({
  position: 'absolute',
  insetInlineEnd: '[100%]',
  top: '[0.5lh]',
  transform: '[translateY(-50%)]',
  opacity: '[var(--anchor-opacity, 0)]',
  transitionProperty: '[opacity]',
  transitionDuration: '[150ms]',
  transitionTimingFunction: '[ease]',
});
