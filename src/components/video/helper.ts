/**
 * Cloudflare Media Transformations URL helper.
 *
 * Syntax reference: https://developers.cloudflare.com/stream/transform-videos/
 *   https://<zone-host>/cdn-cgi/media/<comma-separated-options>/<absolute-source-url>
 *
 * `mode=video` input constraints (per Cloudflare docs): the source MUST be
 * <=100MB, <=10min, H.264 MP4. Output is capped at 60s. This project never
 * truncates — it only ever transforms sources that already fit inside a 60s /
 * 100MB envelope (see `isTransformEligible`); anything larger falls back to
 * the raw MP4 URL untouched.
 */

export const MAX_VIDEO_DURATION_SECONDS = 60;
export const MAX_VIDEO_FILESIZE_BYTES = 100 * 1024 * 1024;

// Default poster timestamp: avoid the very first frame (often a black frame
// before decode settles) while staying near the start of the clip.
const DEFAULT_POSTER_TIME = '1s';

type VideoMeta = {
  duration?: number;
  filesize?: number;
};

type TransformOptions = { mode: 'video'; width?: number } | { mode: 'frame'; time: string; width?: number };

export const isTransformEligible = (meta: VideoMeta): boolean => {
  if (meta.duration === undefined) return false;
  if (meta.filesize === undefined) return false;
  if (meta.duration > MAX_VIDEO_DURATION_SECONDS) return false;
  if (meta.filesize > MAX_VIDEO_FILESIZE_BYTES) return false;

  return true;
};

const resolveAbsoluteSourceURL = (src: string, baseURL: string): string => new URL(src, baseURL).toString();

const serializeTransformOptions = (options: TransformOptions): string => {
  const modePart = [`mode=${options.mode}`];
  const timePart = options.mode === 'frame' ? [`time=${options.time}`] : [];
  const widthPart = options.width !== undefined ? [`width=${options.width}`] : [];
  const audioPart = options.mode === 'video' ? ['audio=false'] : [];

  return [...modePart, ...timePart, ...widthPart, ...audioPart].join(',');
};

const buildTransformURL = (baseURL: string, options: TransformOptions, sourceURL: string): string => new URL(`/cdn-cgi/media/${serializeTransformOptions(options)}/${sourceURL}`, baseURL).toString();

type FormatVideoTransformURLArgs = {
  src: string;
  baseURL: string;
  enabled: boolean;
  width?: number;
  meta: VideoMeta;
};

export const formatVideoTransformURL = (args: FormatVideoTransformURLArgs): string => {
  const { src, baseURL, enabled, width, meta } = args;

  if (enabled !== true) return src;
  if (isTransformEligible(meta) !== true) return src;

  const sourceURL = resolveAbsoluteSourceURL(src, baseURL);
  return buildTransformURL(baseURL, { mode: 'video', width }, sourceURL);
};

type FormatPosterURLArgs = {
  src: string;
  baseURL: string;
  enabled: boolean;
  time?: string;
  width?: number;
};

export const formatPosterURL = (args: FormatPosterURLArgs): string | undefined => {
  const { src, baseURL, enabled, time, width } = args;

  if (enabled !== true) return undefined;

  const sourceURL = resolveAbsoluteSourceURL(src, baseURL);
  return buildTransformURL(baseURL, { mode: 'frame', time: time ?? DEFAULT_POSTER_TIME, width }, sourceURL);
};
