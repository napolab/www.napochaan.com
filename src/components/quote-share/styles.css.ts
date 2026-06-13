import { css } from '@styled/css';

// display: contents — the wrapper adds no box (no layout shift) but stays in the
// DOM so containerRef.contains(node) can scope selections, and pointer events from
// the body bubble up to it.
export const root = css({
  display: 'contents',
});

// Invisible, non-interactive anchor pinned to the selection rect; react-aria
// positions the Popover relative to it. Fixed so getBoundingClientRect returns
// viewport coords matching the rect we captured.
export const anchor = css({
  position: 'fixed',
  top: 'var(--anchor-top)',
  left: 'var(--anchor-left)',
  width: 'var(--anchor-width)',
  height: 'var(--anchor-height)',
  pointerEvents: 'none',
});

// Floating surface — mirrors the sys-bar popover tokens so it matches the existing
// popover and stays within strictTokens.
export const popover = css({
  bg: 'bg.canvas',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'fg.default',
});

export const toolbar = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  padding: '2',
});

export const tooltip = css({
  bg: 'fg.default',
  color: 'bg.canvas',
  fontFamily: 'mono',
  fontSize: 'xs',
  paddingInline: '2',
  paddingBlock: '1',
});
