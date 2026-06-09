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
  // Clamp mode: become a full-width block on mobile so the clamped ghost reserves
  // the box height predictably (desktop keeps the inline-block shrink-wrap).
  '&[data-clamp]': { desktopDown: { display: 'block', width: 'full' } },
  // Truncate mode: cap the shrink-wrapped box at the parent's width and clip, so a
  // single overflowing line settles to an ellipsis instead of spilling past (the
  // box still shrinks to fit a short title). All breakpoints — adjacent-nav clips
  // on mobile (stacked) and desktop (50% column) alike.
  '&[data-truncate]': { maxWidth: 'full', overflow: 'hidden' },
});

export const ghost = css({
  visibility: 'hidden',
  // Clamp mode (mobile): the in-flow ghost reserves the 2-line-max height that the
  // absolute fill decodes within, so the in-view scramble never reflows the box.
  '[data-clamp] &': { desktopDown: { lineClamp: '2', width: 'full' } },
  // Truncate mode: the in-flow ghost reserves a single ellipsised line, so the
  // root's capped width (and thus the absolute fill's width) is set from it.
  '[data-truncate] &': { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
});

// Animated overlay. At rest it wraps exactly like the ghost (same text, same
// `width: full` box) so it overlays the ghost line-for-line — critical for
// multi-line titles (news/works/blog), which must wrap within their column
// instead of spilling a single line out past the viewport.
//
// While decoding (`data-scrambling`, set for the tween's duration) the fill KEEPS
// wrapping so a multi-line title decodes line-for-line instead of collapsing to one
// spilling line. The churning block glyphs are wider than the resolved characters,
// so the wrap can momentarily push to MORE lines than the ghost reserved; because
// the fill is absolute that excess would otherwise spill DOWN over the next row. To
// contain it we pin the fill to the ghost-reserved box (`inset-block-end: 0`) and
// `overflow: hidden` clips any extra churning lines — the same wrap-within-a-fixed-
// box idea the clamp branch already uses on mobile. The box never grows, so nothing
// around the text reflows; the churn just settles into the resolved wrap on complete.
export const fill = css({
  position: 'absolute',
  insetBlockStart: '0',
  insetInlineStart: '0',
  width: 'full',
  textDecorationLine: '[inherit]',
  textUnderlineOffset: '[inherit]',
  '&[data-scrambling]': {
    insetBlockEnd: '0',
    overflow: 'hidden',
  },
  // Clamp mode (mobile): show at most the 2 lines the ghost reserved; the absolute
  // fill churns within that fixed box, so the in-view decode never shifts layout.
  '[data-clamp] &': { desktopDown: { lineClamp: '2' } },
  // Truncate mode: the painted fill is what the user sees, and being absolute it is
  // out of the parent's inline flow — a parent `text-overflow:ellipsis` can't reach
  // it. Apply the single-line ellipsis here so the "…" actually renders.
  '[data-truncate] &': { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
});
