import { css } from '@styled/css';

// Stacked header rows with a bottom rule separating the chrome from the page body
// (echoing the section-heading divider grammar).
export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
  borderBottomWidth: 'default',
  borderBottomStyle: 'solid',
  borderBottomColor: 'fg.default',
  paddingBottom: 'block',
});

// Mono uppercase accent kicker mirroring the hero kicker (`//` prefix supplied by caller).
export const kicker = css({
  fontFamily: 'mono',
  fontSize: 'sm',
  lineHeight: 'snug',
  letterSpacing: 'wider',
  textTransform: 'uppercase',
  color: 'accent.text',
});

// Hero-echo title: the page h1, tracked-out display caps that grow from h2 to h1.
export const title = css({
  textTransform: 'uppercase',
  letterSpacing: 'wider',
  fontSize: { base: 'h2', desktop: 'h1' },
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

// Desktop-only coords annotation (mirrors the hero coords flourish).
export const annotation = css({
  display: { base: 'none', desktop: 'inline-flex' },
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
export const squareRed = css({ ...square, bg: 'danger.solid' });
