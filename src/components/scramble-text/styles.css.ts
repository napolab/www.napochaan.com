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
// Desktop keeps the inline-block ghost/overlay structure (no-reflow hover decode).
// On mobile/tablet (desktopDown) the component collapses to plain in-flow text:
// `root` becomes `inline` and the ghost is dropped so the visible `fill` flows as
// normal inline text — which lets an ancestor `-webkit-line-clamp` actually clamp
// it (the absolute overlay + full-height ghost otherwise defeat the clamp).
export const root = css({
  position: 'relative',
  display: 'inline-block',
  textDecorationLine: '[inherit]',
  textUnderlineOffset: '[inherit]',
  desktopDown: { display: 'inline' },
});

export const ghost = css({
  visibility: 'hidden',
  desktopDown: { display: 'none' },
});

// Animated overlay. At rest it wraps exactly like the ghost (same text, same
// `width: full` box) so it overlays the ghost line-for-line — critical for
// multi-line titles (news/works/blog), which must wrap within their column
// instead of spilling a single line out past the viewport.
//
// While decoding (`data-scrambling`, set for the tween's duration) DESKTOP switches
// to `nowrap`: the churning block glyphs are wider than the resolved characters, so
// without this they would re-break the line as they flicker. `nowrap` pins the
// scramble to a single line that spills horizontally — safe because the desktop
// layer is absolute, so nothing reflows. On MOBILE the fill is in-flow, so nowrap
// would grow the box's width/height (layout shift); there we KEEP wrapping and let
// the parent's `-webkit-line-clamp` + overflow:hidden cap the box, so the scramble
// churns within the already-clamped 2-line box with zero reflow.
export const fill = css({
  position: 'absolute',
  insetBlockStart: '0',
  insetInlineStart: '0',
  width: 'full',
  textDecorationLine: '[inherit]',
  textUnderlineOffset: '[inherit]',
  '&[data-scrambling]': {
    whiteSpace: { base: 'normal', desktop: 'nowrap' },
  },
  // Mobile/tablet: the fill is the only visible copy and must flow in-line so the
  // parent clamp applies and the box never changes size during the decode.
  desktopDown: { position: 'static', width: 'auto', maxWidth: 'full' },
});
