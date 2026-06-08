import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  // Mobile stacks the menu trigger over the status line (two rows, never
  // wrapping); desktop puts the inline nav and status on one row.
  flexDirection: { base: 'column', desktop: 'row' },
  justifyContent: 'space-between',
  alignItems: { base: 'start', desktop: 'center' },
  gap: '4',
  // Wrap only in the desktop row (where nav + status may overflow onto a second
  // line). In the mobile COLUMN, wrap must stay off: a column flex container that
  // is allowed to wrap breaks the menu/status stack into two *columns* whenever
  // the header is given a height shorter than its content (e.g. a transient
  // reflow / iOS dynamic toolbar), which makes `cursors: …` jump up beside `menu`.
  flexWrap: { base: 'nowrap', desktop: 'wrap' },
  borderBottomWidth: 'default',
  borderBottomStyle: 'solid',
  borderBottomColor: 'fg.default',
  paddingBlock: 'element',
});

// Inline nav is desktop-only; below 768px the seven fixed slots would wrap.
export const nav = css({
  display: { base: 'none', desktop: 'flex' },
  gap: '[18px]',
  flexWrap: 'wrap',
});

// The mobile trigger mirrors the nav: shown only where the inline nav is hidden.
export const menuRoot = css({
  display: { base: 'block', desktop: 'none' },
});

export const menuButton = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  fontFamily: 'mono',
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
  // Fixed-width slots so the active (black) highlight box is the same size on
  // every item and never resizes as the current page changes. Sized to fit the
  // longest label ("gallery"); text centered within the slot.
  flex: 'none',
  width: '[9ch]',
  minWidth: '[9ch]',
  textAlign: 'center',
  fontFamily: 'mono',
  fontSize: 'sm',
  paddingInline: '[6px]',
  // Hover affordance is the scramble alone; the active (current page) state keeps
  // its inverted black box.
  '&[data-active]': {
    color: 'fg.onSolid',
    bg: 'fg.default',
  },
});

export const status = css({
  display: 'flex',
  gap: '3',
  flexWrap: 'wrap',
  fontFamily: 'mono',
  fontSize: 'xs',
  color: 'fg.muted',
});

export const gen = css({
  color: 'accent.text',
});

export const rec = css({
  color: 'danger.text',
});

export const watching = css({
  color: 'accent.text',
});

export const toggle = css({
  fontFamily: 'mono',
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
