import { css } from '@styled/css';

// The text is rendered twice: an invisible ghost kept in normal flow reserves the
// resolved text's width and height, and the animated copy is absolutely overlaid
// on top. While the glyphs churn — and block glyphs differ in advance width from
// the resolved text — the element's box never changes, so table columns and flex
// rows (contact buttons) never reflow.
// `text-decoration: inherit` makes the scramble transparent to underline: an
// inline-block box (root) and an absolutely-positioned box (fill) normally drop
// the text-decoration their context establishes, so without this an underline
// from a wrapping <Link> (or parent) would silently not render on the text. With
// it, the Link recipe stays the single source of truth for the underline.
export const root = css({
  position: 'relative',
  display: 'inline-block',
  textDecorationLine: '[inherit]',
  textUnderlineOffset: '[inherit]',
});

export const ghost = css({
  visibility: 'hidden',
});

// Animated overlay. `nowrap` keeps the scramble on a single visual line: when a
// block glyph is wider than the resolved character it spills horizontally (the
// layer is absolute, so nothing reflows) instead of breaking to a new line. At
// rest the fill is the resolved text, which fits the ghost box exactly.
export const fill = css({
  position: 'absolute',
  insetBlockStart: '0',
  insetInlineStart: '0',
  width: 'full',
  whiteSpace: 'nowrap',
  textDecorationLine: '[inherit]',
  textUnderlineOffset: '[inherit]',
});
