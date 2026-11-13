import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
  marginBlock: '8',
});

export const label = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  fontFamily: 'mono',
  fontSize: 'xs',
  fontVariationSettings: '"wght" 600',
  letterSpacing: 'wide',
  color: 'fg.muted',
  textTransform: 'uppercase',
  // The leading rule (formerly literal "──"), drawn as a short border so the
  // glyphs stay out of the markup.
  '&::before': {
    content: '""',
    width: '8',
    borderTopWidth: 'default',
    borderTopStyle: 'solid',
    borderTopColor: 'fg.muted',
  },
});

export const actions = css({
  display: 'flex',
  gap: '3',
  flexWrap: 'wrap',
});
