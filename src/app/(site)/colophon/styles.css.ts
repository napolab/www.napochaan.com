import { css } from '@styled/css';

export const main = css({
  display: 'flex',
  flexDirection: 'column',
  gap: { base: '8', desktop: 'section' },
});

export const cell = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
});

// stack: mono category rows on a shared subgrid so every label lines up and the
// value column starts on one edge.
export const stack = css({
  display: 'grid',
  gridTemplateColumns: '[max-content 1fr]',
  columnGap: 'element',
  rowGap: 'inline',
});

export const stackRow = css({
  display: 'grid',
  gridColumn: '[1 / -1]',
  gridTemplateColumns: '[subgrid]',
  alignItems: 'baseline',
});

export const stackTerm = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  letterSpacing: 'wide',
  textTransform: 'uppercase',
  // fg.muted (≥4.5:1 vs canvas); fg.subtle was 4.03 and failed AA at this size.
  color: 'fg.muted',
});

export const stackDesc = css({
  margin: '0',
  fontFamily: 'mono',
  fontSize: 'sm',
  color: 'fg.default',
});

// source: outline button-style external link (mirrors the about contact link).
export const source = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'inline',
  alignSelf: 'flex-start',
  paddingInline: 'element',
  paddingBlock: '2',
  fontFamily: 'mono',
  fontSize: 'sm',
  textDecorationLine: 'none',
  color: 'fg.default',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.default',
  borderRadius: 'none',
  transitionProperty: '[color,border-color]',
  transitionDuration: 'fast',
  transitionTimingFunction: 'stepSnap',
  _focusVisible: { layerStyle: 'focusRing' },
  '@media (prefers-reduced-motion: reduce)': { transitionDuration: 'instant' },
});

export const sourceLabel = css({
  color: 'fg.muted',
});

export const sourceHandle = css({
  fontWeight: 'medium',
});

// Loose narrator intro line that opens the type / components sections.
export const intro = css({
  margin: '0',
  fontFamily: 'body',
  fontSize: { base: 'md', desktop: 'lg' },
  lineHeight: 'body',
  color: 'fg.muted',
  maxWidth: '[64ch]',
});

// The ambient-chrome pointer list (TypographyBand / GameOfLife / SysBar).
export const ambientList = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'inline',
  margin: '0',
  padding: '0',
  listStyleType: 'none',
});

// The component catalog grid: one column on mobile, two from tablet up.
export const demoGrid = css({
  display: 'grid',
  gridTemplateColumns: { base: '[1fr]', tablet: '[repeat(2, 1fr)]' },
  gap: 'block',
});
