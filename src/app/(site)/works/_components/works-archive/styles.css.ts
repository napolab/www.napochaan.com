import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
});

// Per-row ambient background layer (rendered inside each row's <a>, which carries
// the `group` marker). Fixed to the viewport and sunk behind all content
// (zIndex.hide). The row's thumb url is passed via `--thumb`; on row hover/focus
// the thumb fades in heavily blurred at low opacity so the grid/text stay
// readable. Fixed positioning only holds if no ancestor establishes a
// transform/filter containing block — the archive root and its parents are plain
// flow, so this stays viewport-anchored.
export const ambient = css({
  position: 'fixed',
  inset: '0',
  zIndex: 'hide',
  backgroundImage: 'var(--thumb)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  filter: '[blur(40px)]',
  opacity: '[0]',
  pointerEvents: 'none',
  transitionProperty: '[opacity]',
  transitionDuration: 'base',
  transitionTimingFunction: 'linear',
  _groupHover: { opacity: '[0.25]' },
  _groupFocusVisible: { opacity: '[0.25]' },
  '@media (prefers-reduced-motion: reduce)': {
    transitionDuration: 'instant',
  },
});

// Sticky spine: each year heading tucks under the fixed 24px TypographyBand and
// stacks below any earlier (newer) spines already pinned — all passed years
// accumulate at the top (pure-CSS stacking, no cap). `--spine-index` is the
// group's DOM order (newest-first), set per render; the per-index offset is the
// `top` itself (instant, no transition).
//
// Inverted ink bar — opaque ink bg (fg.default) with light mono year
// (fg.onSolid), the same language as the sys-bar active item. The opaque ink
// reads as a layer "on top" and crisply occludes the rows scrolling under it.
// Height MUST equal the per-index offset step (spacing.10 = 40px) so the stack is
// flush. A hairline bottom rule in canvas tone gives a crisp ink/canvas/ink seam.
//
// scrollMarginTop mirrors `top` so the native #year-XXXX deep-link / spine-link
// click lands the year just under the band + its stacked bars.
// Non-sticky hash target at each year's natural position (the sticky spine would
// barely scroll once pinned). 0-height so it takes no space; scrollMarginTop
// clears the band + the spines stacked above, so the section lands just under the
// accumulated stack.
export const anchor = css({
  display: 'block',
  height: '0',
  scrollMarginTop: '[calc(token(sizes.band) + var(--spine-index, 0) * token(spacing.10))]',
});

export const spine = css({
  position: 'sticky',
  top: '[calc(token(sizes.band) + var(--spine-index, 0) * token(spacing.10))]',
  zIndex: 'sticky',
  display: 'flex',
  alignItems: 'center',
  height: '10',
  bg: 'fg.default',
  color: 'fg.onSolid',
  fontFamily: 'mono',
  fontSize: 'sm',
  fontVariationSettings: '"wght" 600',
  letterSpacing: 'wide',
  borderBottomWidth: 'hairline',
  borderBottomStyle: 'solid',
  borderBottomColor: 'bg.canvas',
});

// Year anchor filling the spine bar. A real link (#year-XXXX) for deep-linking;
// the whole bar is the target so the year text stays the discernible label.
// Text color stays fg.onSolid (already AA on the ink bar); hover adds an
// underline rather than a color shift, so contrast can never regress on the
// near-black bar. Focus ring is inset so the full-width bar can't crop it.
export const spineLink = css({
  display: 'flex',
  alignItems: 'center',
  width: 'full',
  height: 'full',
  paddingInline: 'page',
  textDecorationLine: 'none',
  color: 'fg.onSolid',
  // Inset focus ring (the bar is full-width; an outset ring would be clipped).
  // The Link's own ring is disabled via hideOutsideFocusRing.
  _focusVisible: { layerStyle: 'focusRing', outlineOffset: '[-3px]' },
});

export const rows = css({
  listStyle: 'none',
  margin: '0',
  padding: '0',
  display: 'flex',
  flexDirection: 'column',
});

// Block link row: the whole row is the link target to /works/[id]. A plain <a>,
// so this style fully owns hover/focus.
//
// Hover keeps the text readable: a faint surface wash + the title shifting to
// accent — never the inverted white-on-light the shared link applies.
//
// Focus indicator is drawn INSET (inside the row) in both paths because the row
// spans the full width of `.stage { overflow-x: clip }`; an outward ring would be
// cropped at the clip box. Under motion the global marching-ants ::after is
// re-inset (positive inset → ring inside); under reduced-motion the static dashed
// outline uses a negative outlineOffset so it sits inside the row too.
export const item = css({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: 'element',
  paddingBlock: 'inline',
  textDecorationLine: 'none',
  color: 'fg.default',
  borderBottomWidth: 'hairline',
  borderBottomStyle: 'solid',
  borderBottomColor: 'border.subtle',
  transitionProperty: '[background-color,color]',
  transitionDuration: 'fast',
  transitionTimingFunction: 'stepSnap',
  _hover: { bg: 'bg.subtle' },
  // Reduced-motion fallback: static dashed ring, drawn inside via negative offset.
  '@media (prefers-reduced-motion: reduce)': {
    '&:focus-visible': {
      outlineWidth: 'default',
      outlineStyle: 'dashed',
      outlineColor: 'accent.solid',
      outlineOffset: '[-3px]',
    },
  },
  // Motion path: re-inset the global marching-ants ring so clip can't crop it.
  '&:focus-visible::after': { inset: '[2px]' },
});

// Thumbnail: full-colour image displayed at a fixed 40 × 40 square.
export const thumb = css({
  flexShrink: '0',
  width: '[64px]',
  height: '[64px]',
  objectFit: 'cover',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.default',
});

export const thumbPlaceholder = css({
  flexShrink: '0',
  display: 'inline-block',
  width: '[64px]',
  height: '[64px]',
  bg: 'bg.muted',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.default',
});

// Body: flex container that holds the title and type label together.
// On mobile the two stack vertically (column) so the type badge drops below the
// title rather than crowding it inline. On desktop they sit side-by-side in a
// row, matching the original look (title flex:1 pushes type to the right).
// Title on top, a meta row (type + arrow) below — the row reads as a small card.
export const body = css({
  flex: '1',
  minWidth: '0',
  display: 'flex',
  flexDirection: 'column',
  gap: 'inline',
});

// Layout only — colour + underline come from the `link` recipe applied alongside
// this class (the title reads as an inline link). The 2-line mobile clamp lives
// inside ScrambleText (`clamp`) so the ghost reserves the height (no scramble shift).
export const title = css({
  minWidth: '0',
  fontFamily: 'body',
  fontSize: 'md',
});

// Bottom meta row: type label + go-to arrow. On mobile the arrow sits right next
// to the type (left-packed); on desktop it's pushed to the row's right edge.
export const meta = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: { base: 'flex-start', desktop: 'space-between' },
  gap: 'inline',
});

export const type = css({
  flexShrink: '0',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'xs',
  letterSpacing: 'wide',
  textTransform: 'uppercase',
  color: 'fg.muted',
});

export const arrow = css({
  flexShrink: '0',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'sm',
  color: 'fg.subtle',
});
