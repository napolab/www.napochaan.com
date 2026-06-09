import { css } from '@styled/css';

// Full-viewport boot overlay. Hidden by default so that when the inline Typekit
// loader never runs (JS disabled) the overlay stays out of the way and content
// is usable. The loader adds `html.boot` synchronously in <head> BEFORE the body
// paints, so the visible state below already applies on first paint — no flash of
// the page before the overlay appears. The loader removes `boot` only once fonts
// resolve AND a minimum on-screen time has elapsed (see @themes/typekit), so a
// cached/instant font load can't make this flash for a single frame; when `boot`
// drops, the rule stops matching and the overlay fades back to opacity 0.
export const root = css({
  position: 'fixed',
  // Sit INSIDE the TypographyBand frame (24px on every edge). The bands are the
  // blue (accent.solid) fixed elements iOS Safari samples to tint the safe-area
  // bars; covering them with this white overlay (inset:0) turned the iPhone
  // notch/home-indicator white. Insetting by the band keeps the blue frame the
  // outermost fixed layer, so the safe area stays blue during boot and after.
  inset: '[token(sizes.band)]',
  zIndex: 'toast',
  display: 'grid',
  placeItems: 'center',
  bg: 'bg.canvas',
  // Same 24px grid as the page body, so the overlay reads as the site booting
  // rather than a separate screen.
  backgroundImage: '[linear-gradient(to right, token(colors.grid.line) 1px, transparent 1px), linear-gradient(to bottom, token(colors.grid.line) 1px, transparent 1px)]',
  backgroundSize: '[24px 24px]',
  opacity: '[0]',
  pointerEvents: 'none',
  transitionProperty: '[opacity]',
  transitionDuration: 'slow',
  'html.boot &': { opacity: '[1]', pointerEvents: 'auto' },
});

// Left-aligned mono console block, centered as a unit. Fixed-ish width gives the
// progress bar a defined length on every viewport.
export const consoleRoot = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'element',
  width: '[min(360px, 78vw)]',
});

// Brand line: accent square + wordmark, in the mono system voice.
export const brand = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'inline',
  fontFamily: 'mono',
  fontSize: 'sm',
  fontVariationSettings: '"wght" 600',
  letterSpacing: 'tight',
  color: 'fg.default',
});

export const square = css({
  width: '[10px]',
  height: '[10px]',
  bg: 'accent.solid',
  flexShrink: 0,
});

// Status line: mono uppercase caption with a blinking caret (system-boot feel).
export const status = css({
  display: 'flex',
  alignItems: 'center',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'xs',
  letterSpacing: 'wider',
  textTransform: 'uppercase',
  color: 'fg.muted',
});

export const caret = css({
  display: 'inline-block',
  width: '[0.6em]',
  height: '[1em]',
  marginInlineStart: '[0.3em]',
  bg: 'accent.solid',
  // Blink only when motion is welcome; reduced-motion keeps a steady caret.
  '@media (prefers-reduced-motion: no-preference)': {
    animation: '[blink 1s steps(1) infinite]',
  },
});

// Progress track. The fill eases toward 90% over ~2.8s; because the Typekit
// loader dismisses the overlay within its 3s scriptTimeout (success OR failure),
// the bar never visibly freezes at the cap. Reduced-motion shows a static
// partial fill instead of animating.
export const bar = css({
  position: 'relative',
  width: 'full',
  height: '[4px]',
  bg: 'bg.muted',
  overflow: 'hidden',
});

export const barFill = css({
  position: 'absolute',
  insetBlock: '0',
  insetInlineStart: '0',
  width: 'full',
  bg: 'accent.solid',
  transformOrigin: 'left',
  // Reduced-motion fallback: a steady ~60% fill that reads as "in progress".
  transform: 'scaleX(0.6)',
  '@media (prefers-reduced-motion: no-preference)': {
    transform: 'scaleX(0)',
    animation: '[loadBar 2800ms ease-out forwards]',
  },
});
