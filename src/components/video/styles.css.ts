import { css } from '@styled/css';

// Matches Figure's frame language (hairline border, no radius) so a video sits
// visually consistent with in-body images.
export const root = css({
  position: 'relative',
  display: 'block',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'fg.default',
  borderRadius: 'none',
  m: '0',
});

// `aspectRatio` is driven entirely by the `--video-aspect-ratio` custom property
// (set from the intrinsic width/height props) so the box reserves its final
// footprint before the video's own metadata loads — an unloaded <video> with both
// axes auto collapses to 0x0 and shifts the surrounding layout (same CLS gotcha as
// next/image; see project memory `image-both-axes-auto-cls`).
//
// WCAG 2.2.2: the ambient variant autoplays + loops with no controls, so it has
// no pause/stop/hide mechanism of its own. CSS cannot pause a <video>, so under
// `prefers-reduced-motion: reduce` the ambient video is hidden outright (its
// `data-variant="ambient"` marks it) — `ambientFallback` below takes its place
// when a poster image is available.
export const video = css({
  display: 'block',
  width: 'full',
  aspectRatio: '[var(--video-aspect-ratio)]',
  objectFit: 'cover',
  bg: 'bg.canvas',
  '@media (prefers-reduced-motion: reduce)': {
    '&[data-variant="ambient"]': { display: 'none' },
  },
});

// Static reduced-motion stand-in for the hidden ambient video (see `video`
// above). Hidden under normal motion; shown only when the OS prefers reduced
// motion, and only rendered by the component at all when a poster URL exists.
export const ambientFallback = css({
  display: 'none',
  width: 'full',
  aspectRatio: '[var(--video-aspect-ratio)]',
  objectFit: 'cover',
  bg: 'bg.canvas',
  '@media (prefers-reduced-motion: reduce)': {
    display: 'block',
  },
});

export const caption = css({
  display: 'block',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'xs',
  lineHeight: 'snug',
  color: 'fg.muted',
  px: 'element',
  py: '2',
  borderTopWidth: 'hairline',
  borderTopStyle: 'dashed',
  borderTopColor: 'border.subtle',
});
