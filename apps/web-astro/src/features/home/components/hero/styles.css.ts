import { css } from '@styled/css';

export const root = css({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
  // Desktop airiness: the absolutely-positioned annotations sit in this empty space.
  minHeight: { base: '[auto]', desktop: '[58vh]' },
  // Reserve a bottom band for the desktop-only annotations (coords + "▸ not found"),
  // both pinned to bottom:0. The padding keeps the content/buttons above the band on
  // ANY viewport height — minHeight alone collapses on short viewports and let the
  // annotations overlap the buttons.
  paddingBottom: { base: '0', desktop: 'section' },
});

export const kicker = css({
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'sm',
  lineHeight: 'snug',
  letterSpacing: 'wider',
  textTransform: 'uppercase',
  color: 'accent.text',
});

// Markdown-style blockquote: an accent bar on the left, indented, medium weight.
export const lead = css({
  margin: '0',
  borderLeftWidth: 'strong',
  borderLeftStyle: 'solid',
  borderLeftColor: 'accent.solid',
  paddingLeft: 'element',
  fontFamily: 'body',
  fontWeight: 'medium',
  // Smaller on mobile so the jump ratio against the large wordmark stays strong;
  // grows to lg on desktop.
  fontSize: { base: 'md', desktop: 'lg' },
  lineHeight: 'jp',
  color: 'fg.default',
  maxWidth: '[54ch]',
});

// Secondary catchcopy line under the lead — quieter mono, the breadth note below
// the headline destruction promise.
export const sub = css({
  margin: '0',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: { base: 'sm', desktop: 'md' },
  lineHeight: 'snug',
  letterSpacing: 'wide',
  color: 'fg.muted',
});

// Scattered decorative annotations are a desktop-only flourish — on mobile they
// would overlap the content/buttons.
export const annotationStart = css({
  display: { base: 'none', desktop: 'block' },
  position: 'absolute',
  top: 'section',
  right: 'page',
});

// Bottom-right of the reserved band, sharing the baseline with the coords on the left.
export const annotationEnd = css({
  display: { base: 'none', desktop: 'block' },
  position: 'absolute',
  bottom: '0',
  right: 'page',
});

export const annotationCoords = css({
  display: { base: 'none', desktop: 'inline-flex' },
  position: 'absolute',
  bottom: '0',
  left: '0',
  alignItems: 'center',
  gap: '1',
});

const square = {
  display: 'inline-block',
  width: '[10px]',
  height: '[10px]',
  marginInlineStart: '1',
  verticalAlign: 'middle',
} as const;

export const squareBlue = css({ ...square, bg: 'accent.solid' });
export const squareRed = css({ ...square, bg: 'danger.spot' });

export const buttons = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'element',
});
