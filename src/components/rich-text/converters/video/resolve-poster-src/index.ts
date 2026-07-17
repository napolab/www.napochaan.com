import { formatPosterURL, MAX_VIDEO_FILESIZE_BYTES } from '@components/video/helper';

type VideoMeta = { duration?: number; filesize?: number };

// Media Transformations' input constraints (per Cloudflare docs, restated in
// `@components/video/helper`): the SOURCE must be <=100MB and <=10min. This is
// distinct from `isTransformEligible`'s 60s cap, which only bounds `mode=video`
// OUTPUT — a `mode=frame` poster request is a single-frame extraction and is
// only bound by the input limits. Filesize reuses the shared 100MB constant
// (same Cloudflare-wide input cap); duration gets its own, larger, threshold.
const MAX_POSTER_INPUT_DURATION_SECONDS = 600;

const isPosterInputEligible = (meta: VideoMeta): boolean => {
  if (meta.duration === undefined) return false;
  if (meta.filesize === undefined) return false;
  if (meta.duration > MAX_POSTER_INPUT_DURATION_SECONDS) return false;
  if (meta.filesize > MAX_VIDEO_FILESIZE_BYTES) return false;

  return true;
};

type ResolvePosterSrcArgs = {
  // The block's own `poster` field, already narrowed to a URL if populated.
  explicitPosterURL?: string;
  videoURL: string;
  baseURL: string;
  enabled: boolean;
  meta: VideoMeta;
};

// Poster precedence for the `player` variant: an editor-supplied poster wins
// outright; otherwise auto-generate one via Media Transformations' `mode=frame`
// — but only when the source video fits inside the transform's input envelope
// and transforms are enabled. Anything else renders with no poster at all
// (the browser shows the first frame once metadata loads).
export const resolvePosterSrc = (args: ResolvePosterSrcArgs): string | undefined => {
  const { explicitPosterURL, videoURL, baseURL, enabled, meta } = args;
  if (explicitPosterURL !== undefined) return explicitPosterURL;
  if (isPosterInputEligible(meta) !== true) return undefined;

  return formatPosterURL({ src: videoURL, baseURL, enabled });
};
