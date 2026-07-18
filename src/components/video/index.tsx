import * as styles from './styles.css';

import type { CSSProperties } from 'react';

type Props = {
  src: string;
  // 'ambient': a looping, silent background clip — no controls, no audio.
  // 'player': a controlled clip the visitor starts/seeks themselves.
  variant: 'ambient' | 'player';
  width: number;
  height: number;
  caption?: string;
  // Resolved poster URL. The caller decides *which* URL this is — an explicit
  // poster doc, an auto-generated Media Transformations frame, or nothing —
  // this component only renders whatever it is handed. Used two ways:
  // 'player' shows it via the native `poster` attribute before playback
  // starts; 'ambient' additionally uses it as the source for the
  // prefers-reduced-motion fallback image below (and also sets it as the
  // video's own `poster` attribute, a free first-paint win).
  posterSrc?: string;
};

// Intrinsic width/height become a single CSS custom property so the CSS layer
// can reserve the box's final footprint before the video's own metadata loads.
const aspectRatioStyle = (width: number, height: number): CSSProperties => ({ '--video-aspect-ratio': `${width} / ${height}` }) as CSSProperties;

// React 19 SSR note (verified against react-dom/server's `pushAttribute`, both
// the node and edge builds this project ships on): `muted` IS emitted as a real
// boolean HTML attribute (`muted=""`) in server-rendered markup — the historical
// React gotcha (facebook/react#10389) where `muted` only ever became a JS
// property and never an attribute applied to *client*-created DOM nodes, not to
// nodes parsed from server HTML. Since this component is always rendered as an
// RSC (real SSR, never a client-only mount), the attribute is present in the
// very first HTML the browser parses, so browser autoplay-mute gating is
// satisfied immediately — no `dangerouslySetInnerHTML` workaround needed here.
// See `src/components/video/ssr-muted.test.tsx` for the empirical proof.
// `aria-hidden`: the ambient clip is purely decorative background motion, never
// content a screen reader needs to announce (mirrors the `player` variant,
// which stays announced since its `controls` are the actual interactive
// surface). `poster={posterSrc}` paints the same still the reduced-motion
// fallback below uses, so the very first frame the browser can show (before
// the clip starts playing) is already correct.
const AmbientVideo = ({ src, style, posterSrc }: { src: string; style: CSSProperties; posterSrc?: string }) => (
  <video className={styles.video} style={style} src={src} autoPlay muted loop playsInline poster={posterSrc} data-variant="ambient" aria-hidden="true" />
);

// WCAG 2.2.2 (Pause, Stop, Hide) requires a way to stop auto-playing, looping
// content — the ambient variant has none by design (no controls). CSS cannot
// pause a <video>, and this component must stay a zero-client-JS RSC (no
// mount-time play/pause toggle), so the OS-level `prefers-reduced-motion:
// reduce` preference is honored as the *hide* mechanism instead: `styles.video`
// hides the <video data-variant="ambient"> under that media query, and this
// plain static image (shown only under the same query, via `ambientFallback`)
// stands in for it. A plain <img> — not `@components/image`'s `Image` (a
// client component with its own load-state hook) — keeps this whole subtree
// server-rendered. Omitted entirely when no poster URL resolves (dev /
// transforms disabled): the video is still hidden under reduced-motion, which
// is an acceptable outcome for purely decorative content with no fallback
// asset to show.
const AmbientFallback = ({ src, style, width, height }: { src: string; style: CSSProperties; width: number; height: number }) => (
  <img className={styles.ambientFallback} style={style} src={src} width={width} height={height} alt="" aria-hidden="true" />
);

const PlayerVideo = ({ src, style, posterSrc }: { src: string; style: CSSProperties; posterSrc?: string }) => (
  <video className={styles.video} style={style} src={src} controls preload="metadata" poster={posterSrc} data-variant="player" />
);

// Always wraps in a <figure> — mirrors `Figure` (`src/components/figure`)
// exactly — so a captionless video still gets the hairline frame and reads as
// visually consistent with in-body images, instead of rendering bare.
export const Video = ({ src, variant, width, height, caption, posterSrc }: Props) => {
  const style = aspectRatioStyle(width, height);
  const video =
    variant === 'ambient' ? (
      <>
        <AmbientVideo src={src} style={style} posterSrc={posterSrc} />
        {posterSrc === undefined ? null : <AmbientFallback src={posterSrc} style={style} width={width} height={height} />}
      </>
    ) : (
      <PlayerVideo src={src} style={style} posterSrc={posterSrc} />
    );

  return (
    <figure className={styles.root}>
      {video}
      {caption === undefined ? null : <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
};
