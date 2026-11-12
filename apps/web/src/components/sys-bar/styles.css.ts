import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  // Always a two-row stack — nav/menu on the first row, the live status on the
  // second — at every width. Desktop used to put nav + status on one wrapping
  // row, but the row only split onto a second line *after* hydration (mono font
  // swap + live values widen it past the container), so the bar visibly jumped
  // from one row to two. Stacking from the start makes the 2nd row deterministic.
  flexDirection: 'column',
  alignItems: 'start',
  gap: '4',
  // nowrap at every width: a column flex container that is allowed to wrap breaks
  // the stack into two *columns* whenever the header is given a height shorter
  // than its content (e.g. a transient reflow / iOS dynamic toolbar), which makes
  // `cursors: …` jump up beside the nav/menu row.
  flexWrap: 'nowrap',
  borderBottomWidth: 'default',
  borderBottomStyle: 'solid',
  borderBottomColor: 'fg.default',
  paddingBlock: 'element',
});

// First header row: inline nav + (mobile) menu trigger, side by side. Keeping
// them in one flex row means the mobile shortcut links and the ≡ menu sit on the
// same line instead of stacking (the header itself is a vertical column).
export const navRow = css({
  display: 'flex',
  alignItems: 'center',
  gap: '4',
  flexWrap: 'nowrap',
  // Span the full header width (the header column is `alignItems: start`, which
  // would otherwise shrink the row to its content) so the mobile menu trigger has
  // room to stretch to the right edge.
  width: 'full',
});

// Inline at every width. Below 768px only the `primary` slots remain visible
// (see navLink); the full seven would wrap, so the rest move into the menu.
export const nav = css({
  display: 'flex',
  gap: { base: '3', desktop: '[18px]' },
  flexWrap: 'wrap',
});

// The menu trigger carries the full nav whenever any inline slot has collapsed.
// It hides at desktop (768px), the same width where the last slot (blog) reappears
// and the full seven sit inline — so the trigger and the seventh slot never show
// at once. It must vanish exactly when blog appears (not at ~670 where the other
// six already fit): the trigger is as wide as a slot (~75.6px measured), so "six
// inline + trigger" and "seven inline, no trigger" cost the same width — collapse
// them at one threshold and gallery + blog would pop in together. Holding the
// trigger to 768 keeps blog in the menu through the 678–767 band so the row still
// fills one slot at a time. `margin-inline-start: auto` pins the trigger right.
export const menuRoot = css({
  display: { base: 'block', desktop: 'none' },
  marginInlineStart: 'auto',
});

export const menuButton = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'sm',
  paddingBlock: '[2px]',
  paddingInline: '[8px]',
  color: 'fg.default',
  bg: 'transparent',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'fg.default',
  cursor: 'pointer',
  '&[data-hovered]': { bg: 'fg.default', color: 'fg.onSolid' },
  '&[data-pressed]': { bg: 'fg.default', color: 'fg.onSolid' },
});

// react-aria Popover — a bordered terminal panel anchored under the trigger.
// An explicit literal width (not min-width, not a token var) so the panel can
// never collapse to the trigger's narrow width: iOS Safari sizes react-aria
// popovers off `--trigger-width` (~75px here), and min-width did not reliably
// override that. A fixed 12rem comfortably fits the longest label ("gallery"),
// and the viewport cap keeps it on-screen on the smallest phones.
export const popover = css({
  width: '[12rem]',
  maxWidth: '[calc(100vw - 3rem)]',
  bg: 'bg.canvas',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'fg.default',
});

export const menu = css({
  display: 'flex',
  flexDirection: 'column',
  padding: '[4px]',
  outlineStyle: 'none',
});

export const menuItem = css({
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'sm',
  paddingBlock: '[6px]',
  paddingInline: '[10px]',
  color: 'fg.default',
  textAlign: 'start',
  cursor: 'pointer',
  outlineStyle: 'none',
  '&[data-hovered]': { bg: 'bg.subtle' },
  '&[data-focused]': { bg: 'bg.subtle' },
  // Current page — same inverted slot the inline nav uses for the active item.
  '&[data-active]': { color: 'fg.onSolid', bg: 'fg.default' },
});

export const navLink = css({
  // Progressive collapse, tuned to the *measured* one-line fit so the row stays
  // as full as possible and only sheds an item right before it would wrap. As the
  // viewport shrinks the row drops one slot at a time from the right (blog → … →
  // index, which always stays); whatever is hidden stays reachable in the menu,
  // which always lists the full set. Each threshold is the min-width at which the
  // N leftmost slots + the menu trigger fit on one line. Geometry was read off the
  // live bar: slot 75.6px, gap 12px, navRow→trigger gap 16px, trigger 75.6px,
  // mobile gutter 64px → required(M) = 87.6·M + 143.6, plus ~8px slack. blog is
  // the exception: it appears at desktop (768) as the trigger hides, because "6
  // slots + trigger" and "7 slots, no trigger" cost the same width (see menuRoot),
  // so giving blog its own sub-768 threshold would pop it in alongside gallery.
  // Raw @media keeps these per-row widths out of the shared breakpoint scale;
  // order 6 reuses the desktop token since it is precisely the full-row width.
  display: 'none',
  '&[data-order="0"]': { display: 'block' },
  '&[data-order="1"]': { '@media (min-width: 325px)': { display: 'block' } },
  '&[data-order="2"]': { '@media (min-width: 414px)': { display: 'block' } },
  '&[data-order="3"]': { '@media (min-width: 502px)': { display: 'block' } },
  '&[data-order="4"]': { '@media (min-width: 590px)': { display: 'block' } },
  '&[data-order="5"]': { '@media (min-width: 678px)': { display: 'block' } },
  '&[data-order="6"]': { display: { base: 'none', desktop: 'block' } },
  // Fixed-width slots so the active (black) highlight box is the same size on
  // every item and never resizes as the current page changes. 9ch at every width:
  // long labels now collapse inline (not just into the menu), so every slot must
  // hold the longest one ("gallery", 7 chars) plus its 12px inline padding —
  // border-box, so the padding is subtracted from the 9ch. 9ch (≈75.6px) leaves
  // "gallery" (≈58.8px) comfortable slack and keeps the run evenly clustered
  // however many slots remain after the collapse.
  flex: 'none',
  width: '[9ch]',
  minWidth: '[9ch]',
  textAlign: 'center',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'sm',
  paddingInline: '[6px]',
  // Hover affordance is the scramble alone; the active (current page) state keeps
  // its inverted black box.
  '&[data-active]': {
    color: 'fg.onSolid',
    bg: 'fg.default',
  },
});

// The live status row. Every value here updates on its own clock — the wall
// clock ticks each second, the Game of Life gen / alive counters change each
// frame, the presence count and the cursors toggle flip on interaction. Because
// the face is mono, every glyph is the same width, so the ONLY thing that shifts
// layout is the digit COUNT (alive 9 → 139 → 1408) or the on⇄off length flip.
// Each cell below therefore reserves a fixed `ch` slot sized to its widest value
// (see per-cell notes); values grow into the reserved slack instead of pushing
// every sibling to their right (and, at narrow widths, re-wrapping the row).
export const status = css({
  display: 'flex',
  gap: '3',
  flexWrap: 'wrap',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'xs',
  color: 'fg.muted',
});

// Shared cell behaviour: never flex-grow/shrink, never wrap a value mid-cell,
// tabular digits so successive readings line up column-for-column.
const cell = {
  flex: 'none',
  whiteSpace: 'nowrap',
  fontVariantNumeric: 'tabular-nums',
} as const;

// HH:mm:ss — always 8 glyphs.
export const clock = css({ ...cell, width: '[8ch]' });

// "gen " (4) + the padStart(4) counter; 5 digits covers any realistic session.
export const gen = css({ ...cell, width: '[9ch]', color: 'accent.text' });

// "alive " (6) + the live-cell count, which stays below 10000 (4 digits).
export const alive = css({ ...cell, width: '[10ch]' });

// Static label — only needs `flex: none` so the row can't stretch it.
export const rec = css({ flex: 'none', whiteSpace: 'nowrap', color: 'danger.text' });

// "watching " (9) + the presence count (3 digits is ample).
export const watching = css({ ...cell, width: '[12ch]', color: 'accent.text' });

// "cursors: off" (12) is the widest state; reserving it means on⇄off never shifts.
export const toggle = css({
  ...cell,
  width: '[12ch]',
  textAlign: 'start',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'xs',
  color: 'fg.muted',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: '0',
  textDecoration: 'underline',
  _hover: { color: 'accent.text' },
});

export const checker = css({
  height: '[16px]',
  marginBlock: 'element',
  backgroundImage: '[conic-gradient(token(colors.fg.default) 25%, transparent 0 50%, token(colors.fg.default) 0 75%, transparent 0)]',
  backgroundSize: '[16px 16px]',
});
