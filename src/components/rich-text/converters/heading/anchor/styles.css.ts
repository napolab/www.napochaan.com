import { css } from '@styled/css';

// Left-gutter copy affordance for a richtext heading. The `#` glyph is CSS content,
// so no glyph text lands in JSX. Visibility is inherited from the heading's
// `--anchor-opacity` custom property (set there on :hover / :focus-within), so no
// descendant selector is needed. `insetInlineEnd: 100%` parks the box entirely in
// the gutter with its right edge at the text's left edge, so it scales with the
// heading and stays clear of the prose. The glyph is `1em` (matches the heading)
// and bold (wght 700) so it reads as a deliberate mark, vertically centered on the
// heading's first line via `top: 0.5lh` + `translateY(-50%)` (the anchor inherits
// the heading's line-height, so `lh` resolves to its line box). `var()` opacity,
// the transitions, transform and sizes are strictTokens escape-hatch values. The
// revealed `#` is neutral (hover darkens); electric-blue is reserved for the copied
// flash (a plain colour change, no glow) so it stays visible against the hover tone.
export const root = css({
  position: 'absolute',
  insetInlineEnd: '[100%]',
  top: '[0.5lh]',
  transform: '[translateY(-50%)]',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '[1.2em]',
  height: '[1.4em]',
  fontFamily: 'mono',
  fontSize: '[1em]',
  fontVariationSettings: '"wght" 700',
  color: 'fg.muted',
  cursor: 'pointer',
  opacity: '[var(--anchor-opacity, 0)]',
  transitionProperty: '[opacity, color]',
  transitionDuration: '[150ms]',
  transitionTimingFunction: '[ease]',
  _before: { content: '"#"' },
  '&[data-hovered]': { color: 'fg.default' },
  '&[data-copied]': { color: 'accent.solid' },
  // Standard marching-ants focus ring, pulled INSIDE the box. The global
  // `*:focus-visible::after` sits at `inset: -3px` (outside the box), which the
  // SiteShell's `overflowX: clip` crops when the box is in the gutter — and
  // `overflow-clip-margin` is ignored on a single-axis clip, so it can't be widened
  // away. Insetting the ring keeps it within the box (and so within the clip),
  // mirroring works-archive's spineLink. The layerStyle outline is the
  // reduced-motion fallback, inset to match.
  _focusVisible: { layerStyle: 'focusRing', outlineOffset: '[-3px]' },
  '&:focus-visible::after': { inset: '[3px]' },
});
