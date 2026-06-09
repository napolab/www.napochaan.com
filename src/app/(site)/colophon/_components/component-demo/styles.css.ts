import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'element',
  padding: 'block',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.default',
});

export const name = css({
  margin: '0',
  fontFamily: 'mono',
  fontSize: 'xs',
  fontVariationSettings: '"wght" 600',
  letterSpacing: 'wide',
  textTransform: 'uppercase',
  color: 'accent.text',
});

export const why = css({
  margin: '0',
  fontFamily: 'body',
  fontSize: 'sm',
  lineHeight: 'body',
  color: 'fg.muted',
  maxWidth: '[60ch]',
});

// The live demo stage. Wide demos (Table, EchoText display type) scroll inside
// the cell instead of being clipped; the SiteShell stage already clips at the
// viewport, so no page-level horizontal scroll leaks out.
export const stage = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'element',
  paddingBlock: 'element',
  overflow: 'hidden',
});
