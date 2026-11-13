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

// The live demo stage. Wide demos (Table, EchoText display type) are clipped to
// the cell so they never push the grid past the page; the SiteShell stage also
// clips at the viewport, so no horizontal scroll leaks out.
//
// `overflow: clip` (not `hidden`) + `overflow-clip-margin` lets the demos' focus
// rings survive: the marching-ants ::after sits at inset -3px (≈5px outside the
// focused box) and the reduced-motion fallback outline at offset 3px. A plain
// `hidden` clips both at the stage edge; clip keeps ink overflow visible within
// the 8px margin while still clipping the wide layout overflow.
export const stage = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'element',
  paddingBlock: 'element',
  overflow: 'clip',
  overflowClipMargin: '[8px]',
});
