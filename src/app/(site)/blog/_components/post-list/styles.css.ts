import { css } from '@styled/css';

export const list = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
});

// The whole post is one clickable card (index + title + meta + excerpt). The
// hover treatment (title scramble) lives in PostCard's GSAP, not here.
export const card = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'inline',
  padding: 'element',
  color: 'fg.default',
  textDecorationLine: 'none',
});

export const index = css({
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'xs',
  letterSpacing: 'wide',
  color: 'accent.text',
});

// The title carries the link affordance — accent.text (the inline-link color)
// signals the whole card is clickable, while the surrounding index/meta/excerpt
// stay neutral. The scramble runs over this same accent ink.
export const title = css({
  fontFamily: 'body',
  fontWeight: 'medium',
  fontSize: 'lg',
  lineHeight: 'snug',
});

export const meta = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 'inline',
});

export const excerpt = css({
  fontFamily: 'body',
  fontSize: 'md',
  lineHeight: 'jp',
  color: 'fg.muted',
});
