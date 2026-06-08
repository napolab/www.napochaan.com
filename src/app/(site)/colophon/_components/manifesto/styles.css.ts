import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
});

export const item = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'inline',
});

// One finding: a mono marker stacked above its headline, like a chart row.
export const term = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5',
});

// The finding marker ("所見 01") — mono system-annotation voice, matching
// SectionHeading's no marker.
export const no = css({
  fontFamily: 'mono',
  fontSize: 'sm',
  letterSpacing: 'wide',
  color: 'accent.text',
});

// The finding headline — prominent, bold, the line that should land first.
export const headline = css({
  fontFamily: 'body',
  fontWeight: 'bold',
  fontSize: { base: 'md', desktop: 'lg' },
  lineHeight: 'snug',
  color: 'fg.default',
});

export const description = css({
  margin: '0',
  fontFamily: 'body',
  fontSize: 'md',
  lineHeight: 'body',
  color: 'fg.muted',
  // Fixed rem (not ch) so the measure matches the section intro above; strict
  // line-break applies Japanese kinsoku for cleaner wrapping.
  maxWidth: '[40rem]',
  lineBreak: 'strict',
});
