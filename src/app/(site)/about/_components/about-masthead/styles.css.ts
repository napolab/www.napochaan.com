import { css } from '@styled/css';

export const root = css({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
  // Airy on desktop so the absolutely-positioned annotations have empty space to
  // sit in without overlapping the wordmark/lead.
  minHeight: { base: '[auto]', desktop: '[42vh]' },
});

export const kicker = css({
  fontFamily: 'mono',
  fontSize: 'sm',
  lineHeight: 'snug',
  letterSpacing: 'wider',
  textTransform: 'uppercase',
  color: 'accent.text',
});

// The wrapping h1; EchoText owns the display size, so this only clears margin.
export const title = css({
  margin: '0',
});

// Markdown-blockquote lead: accent bar left, medium weight, grows on desktop.
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

// Desktop-only decorative marginalia — on mobile they would overlap the content.
export const annotationStart = css({
  display: { base: 'none', desktop: 'block' },
  position: 'absolute',
  top: 'section',
  right: 'page',
});

export const annotationEnd = css({
  display: { base: 'none', desktop: 'block' },
  position: 'absolute',
  bottom: 'section',
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
export const squareRed = css({ ...square, bg: 'danger.solid' });
