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

// Animated overlay. At rest it wraps exactly like the ghost (same text, same
// `width: full` box) so it overlays the ghost line-for-line — critical for
// multi-line titles (news/works/blog), which must wrap within their column
// instead of spilling a single line out past the viewport.
//
// While decoding (`data-scrambling`, set for the tween's duration) it switches to
// `nowrap`: the churning block glyphs are wider than the resolved characters, so
// without this they would re-break the line as they flicker. `nowrap` pins the
// scramble to a single line that spills horizontally (the layer is absolute, so
// nothing reflows); when the decode completes the attribute drops and the
// resolved text settles back into its wrapped layout. Mobile has no hover, so the
// scramble never fires there and the title simply wraps.
export const fill = css({
  position: 'absolute',
  insetBlockStart: '0',
  insetInlineStart: '0',
  width: 'full',
  textDecorationLine: '[inherit]',
  textUnderlineOffset: '[inherit]',
  '&[data-scrambling]': {
    whiteSpace: 'nowrap',
  },
});
