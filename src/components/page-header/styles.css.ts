import { css } from '@styled/css';

// Stacked header rows with a bottom rule separating the chrome from the page body
// (echoing the section-heading divider grammar).
export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
  borderBottomWidth: 'default',
  borderBottomStyle: 'solid',
  borderBottomColor: 'fg.default',
  paddingBottom: 'block',
});

// Mono uppercase accent kicker mirroring the hero kicker (`//` prefix supplied by caller).
export const kicker = css({
  fontFamily: 'mono',
  fontSize: 'sm',
  lineHeight: 'snug',
  letterSpacing: 'wider',
  textTransform: 'uppercase',
  color: 'accent.text',
});

// The page h1, owned fully by this class (plain <h1>, no Heading): caps that
// grow from h2 to h1, outranking the global `h1` element styles so font/tracking
// are reliable. Index labels (works / news / blog / colophon) use the loud
// digibop display face — short English words carry it. Long content titles opt
// into mono + tighter tracking via `titleTracking="tight"` (digibop renders long
// mixed-script titles poorly).
export const title = css({
  fontFamily: 'display',
  fontWeight: 'normal',
  lineHeight: 'tight',
  color: 'fg.default',
  textTransform: 'uppercase',
  letterSpacing: 'tighter',
  fontSize: { base: 'h2', desktop: 'h1' },
  // Mobile/tablet: long content titles clamp to 2 lines with ellipsis (the
  // lineClamp utility expands to the -webkit-box + box-orient + line-clamp set).
  // Desktop keeps the full title.
  desktopDown: { lineClamp: '2' },
  '&[data-tracking="tight"]': { fontFamily: 'mono', letterSpacing: '[-0.06em]' },
});

// Markdown-style blockquote lead: accent bar on the left, indented, medium weight.
export const lead = css({
  margin: '0',
  borderLeftWidth: 'strong',
  borderLeftStyle: 'solid',
  borderLeftColor: 'accent.solid',
  paddingLeft: 'element',
  fontFamily: 'body',
  fontWeight: 'medium',
  fontSize: { base: 'md', desktop: 'lg' },
  lineHeight: 'jp',
  color: 'fg.default',
  maxWidth: '[54ch]',
});

// Desktop-only coords annotation (mirrors the hero coords flourish).
export const annotation = css({
  display: { base: 'none', desktop: 'inline-flex' },
  alignItems: 'center',
  gap: '1',
});

const square = {
  display: 'inline-block',
  width: '[10px]',
  height: '[10px]',
  marginInlineStart: '1',
  verticalAlign: 'middle',
} as const;

export const squareBlue = css({ ...square, bg: 'accent.solid' });
export const squareRed = css({ ...square, bg: 'danger.spot' });

// --- Loading skeleton -------------------------------------------------------
// Mirrors the PageHeader vertical rhythm (same gap / bottom rule / padding) so
// swapping the real header in does not shift layout (CLS guard). Decorative —
// the whole tree is aria-hidden.
//
// Zero-JS exact sizing: each slot mirrors the REAL element's width-affecting
// font props (fontFamily/fontSize/lineHeight/letterSpacing/textTransform/
// fontWeight). In known-text mode it masks the real text (transparent ink on a
// muted block) so the box reserves the exact width AND height with no DOM
// measurement. In bar mode (`data-mode="bar"`) it falls back to a one-line-box
// (`1lh`) of that font at a percentage width.
export const skeletonRoot = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
  borderBottomWidth: 'default',
  borderBottomStyle: 'solid',
  borderBottomColor: 'border.subtle',
  paddingBottom: 'block',
});

// Shared masked-block treatment. Known-text mode hugs the masked text
// (`max-content`); bar mode overrides width + height via `data-mode="bar"`.
const skeletonSlot = {
  display: 'inline-block',
  color: 'transparent',
  bg: 'bg.muted',
  borderRadius: 'none',
  width: '[max-content]',
} as const;

// Breadcrumb row placeholder — mono caption (mirrors Breadcrumbs root).
export const skeletonBreadcrumb = css({
  ...skeletonSlot,
  fontFamily: 'mono',
  fontSize: 'xs',
  lineHeight: 'snug',
  '&[data-mode="bar"]': { height: '[1lh]', width: '[40%]' },
});

// Mono uppercase kicker placeholder (mirrors PageHeader kicker).
export const skeletonKicker = css({
  ...skeletonSlot,
  fontFamily: 'mono',
  fontSize: 'sm',
  lineHeight: 'snug',
  letterSpacing: 'wider',
  textTransform: 'uppercase',
  '&[data-mode="bar"]': { height: '[1lh]', width: '[28%]' },
});

// Hero-echo h1 placeholder — tracked-out display caps that grow h2 → h1
// (mirrors Heading root + PageHeader title).
export const skeletonTitle = css({
  ...skeletonSlot,
  fontFamily: 'display',
  fontWeight: 'normal',
  fontSize: { base: 'h2', desktop: 'h1' },
  lineHeight: 'tight',
  letterSpacing: 'wider',
  textTransform: 'uppercase',
  '&[data-mode="bar"]': { height: '[1lh]', width: '[60%]' },
});

// Blockquote lead placeholder — medium body that grows md → lg (mirrors lead).
export const skeletonLead = css({
  ...skeletonSlot,
  fontFamily: 'body',
  fontWeight: 'medium',
  fontSize: { base: 'md', desktop: 'lg' },
  lineHeight: 'jp',
  '&[data-mode="bar"]': { height: '[1lh]', width: '[80%]' },
});
