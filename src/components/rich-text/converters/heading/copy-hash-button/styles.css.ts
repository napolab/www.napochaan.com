import { css } from '@styled/css';

// Appearance of the copy-hash button: a bold mono `#` glyph (CSS content, so no
// glyph text in JSX) sized to the surrounding text. Neutral at rest, darker on
// hover, and electric-blue for the brief copied flash. The focus ring is the
// standard marching-ants, pulled INSIDE the box (`outlineOffset: -3px` on the
// layerStyle fallback + `::after { inset }`) so a caller can park it in a clipped
// gutter without the ring getting cropped — see works-archive's spineLink. Layout
// (gutter position, reveal) is left to the consumer's `className`.
export const root = css({
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
  transitionProperty: '[color]',
  transitionDuration: '[150ms]',
  transitionTimingFunction: '[ease]',
  _before: { content: '"#"' },
  '&[data-hovered]': { color: 'fg.default' },
  '&[data-copied]': { color: 'accent.solid' },
  _focusVisible: { layerStyle: 'focusRing', outlineOffset: '[-3px]' },
  '&:focus-visible::after': { inset: '[3px]' },
});
