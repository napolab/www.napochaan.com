import { css } from '@styled/css';

// Left-gutter copy affordance for a richtext heading. The `#` / `✓` glyph is CSS
// content, so no glyph text lands in JSX. Visibility is inherited from the
// heading's `--anchor-opacity` custom property (set there on :hover /
// :focus-within), so no descendant selector is needed here. The em-based offset,
// `var()` opacity, transitions and pixel sizes are strictTokens escape-hatch
// values (`[...]`) — they have no semantic token and must scale with the heading.
// `insetInlineStart` uses `em` so the offset tracks the heading's type scale;
// `width` / `height` use `rem` so the hit target stays a stable size regardless
// of heading level.
export const root = css({
  position: 'absolute',
  insetInlineStart: '[-1.5em]',
  top: '0',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '[1.5rem]',
  height: '[1.5rem]',
  fontFamily: 'mono',
  fontSize: 'md',
  lineHeight: 'none',
  color: 'fg.muted',
  cursor: 'pointer',
  opacity: '[var(--anchor-opacity, 0)]',
  transitionProperty: '[opacity, color]',
  transitionDuration: '[150ms]',
  transitionTimingFunction: '[ease]',
  _before: { content: '"#"' },
  '&[data-hovered]': { color: 'accent.solid' },
  '&[data-copied]': { color: 'accent.solid' },
  '&[data-copied]::before': { content: '"✓"' },
  '&[data-focus-visible]': {
    outlineWidth: '[2px]',
    outlineStyle: 'solid',
    outlineColor: 'accent.solid',
    outlineOffset: '[2px]',
  },
});
