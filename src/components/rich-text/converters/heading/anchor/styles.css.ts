import { css } from '@styled/css';

// Left-gutter copy affordance for a richtext heading. The `#` glyph is CSS content,
// so no glyph text lands in JSX. Visibility is inherited from the heading's
// `--anchor-opacity` custom property (set there on :hover / :focus-within), so no
// descendant selector is needed. The offset is `em` so it tracks the heading's
// type scale; the glyph is `1em` to match the heading font and the box is `1.5em`
// square so the hit target scales with it. `var()` opacity, transitions, the glow
// and the pixel outline are strictTokens escape-hatch values (`[...]`). The `#` is
// revealed in a neutral tone (hover darkens slightly) and the electric-blue is
// reserved for the copied flash, so the flash stays visible against the hover tone.
export const root = css({
  position: 'absolute',
  insetInlineStart: '[-1.5em]',
  top: '0',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '[1.5em]',
  height: '[1.5em]',
  fontFamily: 'mono',
  fontSize: '[1em]',
  lineHeight: 'none',
  color: 'fg.muted',
  cursor: 'pointer',
  opacity: '[var(--anchor-opacity, 0)]',
  transitionProperty: '[opacity, color, text-shadow]',
  transitionDuration: '[150ms]',
  transitionTimingFunction: '[ease]',
  _before: { content: '"#"' },
  '&[data-hovered]': { color: 'fg.default' },
  '&[data-copied]': { color: 'accent.solid', textShadow: '[0 0 6px token(colors.accent.solid)]' },
  '&[data-focus-visible]': {
    outlineWidth: '[2px]',
    outlineStyle: 'solid',
    outlineColor: 'accent.solid',
    outlineOffset: '[2px]',
  },
});
