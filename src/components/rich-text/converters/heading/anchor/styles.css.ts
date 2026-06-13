import { css } from '@styled/css';

// Left-gutter copy affordance for a richtext heading. The `#` glyph is CSS content,
// so no glyph text lands in JSX. Visibility is inherited from the heading's
// `--anchor-opacity` custom property (set there on :hover / :focus-within), so no
// descendant selector is needed. The offset/size are `em` so they track the heading
// type scale; the glyph is `1em` (matches the heading) and bold (wght 700) so it
// reads as a deliberate mark. It is vertically centered on the heading's first line
// via `top: 0.5lh` + `translateY(-50%)` — the anchor inherits the heading's
// line-height, so `lh` resolves to the heading's line box. `var()` opacity, the
// transitions, glow, transform and pixel outline are strictTokens escape-hatch
// values (`[...]`). The revealed `#` is neutral (hover darkens); electric-blue is
// reserved for the copied flash so it stays visible against the hover tone.
export const root = css({
  position: 'absolute',
  insetInlineStart: '[-1.5em]',
  top: '[0.5lh]',
  transform: '[translateY(-50%)]',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '[1.4em]',
  height: '[1.4em]',
  fontFamily: 'mono',
  fontSize: '[1em]',
  fontVariationSettings: '"wght" 700',
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
    outlineOffset: '[1px]',
  },
});
