import { css } from '@styled/css';

// Hug the text so the link isn't a full-width block (its hover never stretches
// across the row). mono / semibold / wide tracking inherits the system voice of
// the foot-of-page nav it replaces — but at sm, not the buried xs it used to be.
export const root = css({
  alignSelf: 'start',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'inline',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'sm',
  letterSpacing: 'wide',
});

// Decorative back arrow. Ink-coloured (fg.default) against the accent label so the
// glyph reads as direction, not as part of the link text. The link itself is
// tone="accent", so this span overrides the colour back to ink.
export const arrow = css({
  flexShrink: '0',
  color: 'fg.default',
});

// The label owns the resting underline (the link passes underline={false}); the
// arrow stays undecorated. ScrambleText paints its fill in an absolute box, so the
// underline sits on this in-flow wrapper exactly like adjacent-nav's label.
export const label = css({
  textDecorationLine: 'underline',
  textUnderlineOffset: '[2px]',
});
