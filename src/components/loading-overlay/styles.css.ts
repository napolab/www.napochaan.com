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
  inset: '0',
  zIndex: 'toast',
  display: 'grid',
  placeItems: 'center',
  // Solid accent blue (matching the TypographyBand frame), full-bleed to the
  // viewport edges. This is deliberate: iOS Safari tints the safe-area bars
  // (notch / home indicator) from a shown fixed element's background-color, so a
  // white overlay painted those bars white until a scroll forced re-sampling.
  // Booting on the brand blue means the safe area is blue from the very first
  // frame, with the same blue + white-mono voice as the TypographyBand.
  bg: 'accent.solid',
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
  color: 'fg.onSolid',
});

export const square = css({
  width: '[10px]',
  height: '[10px]',
  bg: 'fg.onSolid',
  flexShrink: 0,
});

// Question line: mono uppercase prompt with a blinking caret (system-boot feel).
// The typed text itself is produced by the BootQuestion client island, which
// cycles the prompts via the useTypewriter hook; this style only dresses the line.
// nowrap keeps the longest prompt on one line so cycling never changes the height.
export const status = css({
  display: 'flex',
  alignItems: 'center',
  whiteSpace: 'nowrap',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'xs',
  letterSpacing: 'wider',
  textTransform: 'uppercase',
  // Full white on blue keeps WCAG AA; hierarchy comes from the smaller size and
  // uppercase tracking rather than a dimmer tone (no onSolid-muted token).
  color: 'fg.onSolid',
});

export const caret = css({
  display: 'inline-block',
  width: '[0.6em]',
  height: '[1em]',
  marginInlineStart: '[0.3em]',
  bg: 'fg.onSolid',
  // Blink driven by the global motion switch: paused (OS reduce / header toggle)
  // freezes the caret steady.
  animation: '[blink 1s steps(1) infinite]',
  animationPlayState: 'var(--motion-play, running)',
});

// Progress track. The fill eases toward 90% over ~2.8s; because the Typekit
// loader dismisses the overlay within its 3s scriptTimeout (success OR failure),
// the bar never visibly freezes at the cap. Reduced-motion shows a static
// partial fill instead of animating.
export const bar = css({
  position: 'relative',
  width: 'full',
  height: '[4px]',
  // Track is a slightly darker blue (the band's hairline tone); the white fill
  // rides on top so progress reads clearly on the blue boot screen.
  bg: 'accent.solidHover',
  overflow: 'hidden',
});

export const barFill = css({
  position: 'absolute',
  insetBlock: '0',
  insetInlineStart: '0',
  width: 'full',
  bg: 'fg.onSolid',
  transformOrigin: 'left',
  // Reduced-motion fallback: a steady ~60% fill that reads as "in progress".
  transform: 'scaleX(0.6)',
  '@media (prefers-reduced-motion: no-preference)': {
    transform: 'scaleX(0)',
    animation: '[loadBar 2800ms ease-out forwards]',
  },
});
