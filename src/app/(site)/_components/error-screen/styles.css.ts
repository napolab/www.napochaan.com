import { css } from '@styled/css';

// Sparse, centered-ish error block with generous vertical breathing room — the
// page has almost no content, so the rhythm leans on whitespace.
export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
  alignItems: 'flex-start',
  paddingBlock: 'section',
});

// Mono uppercase accent kicker mirroring the hero kicker (`// ${code} — ${kind}`).
export const kicker = css({
  fontFamily: 'mono',
  fontSize: 'sm',
  lineHeight: 'snug',
  letterSpacing: 'wider',
  textTransform: 'uppercase',
  color: 'accent.text',
});

// The big error code as the page h1, rendered in the danger ink at hero scale.
export const code = css({
  color: 'danger.text',
  fontFamily: 'display',
  fontSize: { base: 'h1', desktop: 'hero' },
  letterSpacing: 'tighter',
  lineHeight: 'none',
});

// Markdown-style blockquote lead: accent bar on the left, indented, medium weight.
export const lead = css({
  margin: '0',
  borderLeftWidth: 'strong',
  borderLeftStyle: 'solid',
  borderLeftColor: 'accent.solid',
  paddingLeft: 'element',
  fontFamily: 'body',
  fontWeight: 'medium',
  fontSize: { base: 'md', desktop: 'lg' },
  lineHeight: 'jp',
  color: 'fg.default',
  maxWidth: '[54ch]',
});

// Danger annotation tag sitting under the lead (mono, supplied by caller).
export const tag = css({
  display: 'inline-flex',
});

// Action row: home link / retry button laid out inline.
export const actions = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 'element',
});

// Mono home link shared by the 404 and 500 screens.
export const homeLink = css({
  fontFamily: 'mono',
  fontSize: { base: 'xs', desktop: 'sm' },
  letterSpacing: 'wide',
  color: 'accent.text',
  textDecorationLine: 'underline',
  textUnderlineOffset: '[2px]',
  transitionProperty: '[background-color,color]',
  transitionDuration: 'fast',
  transitionTimingFunction: 'stepSnap',
  _hover: {
    bg: 'accent.solid',
    color: 'fg.onSolid',
    textDecorationLine: 'none',
  },
  _focusVisible: { layerStyle: 'focusRing' },
});
