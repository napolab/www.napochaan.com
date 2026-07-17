import { formatVideoTransformURL } from '@components/video/helper';

type VideoMeta = { duration?: number; filesize?: number };

type ResolveVideoSrcArgs = {
  variant: 'ambient' | 'player';
  url: string;
  baseURL: string;
  enabled: boolean;
  meta: VideoMeta;
};

// The `player` variant streams the source MP4 as-is (visitor-controlled seeking
// wants the full-quality file). Only `ambient` — a silent, looping background
// clip — is worth routing through Media Transformations for the downsized,
// audio-stripped rendition; `formatVideoTransformURL` itself falls back to the
// raw url when disabled or ineligible.
export const resolveVideoSrc = (args: ResolveVideoSrcArgs): string => {
  const { variant, url, baseURL, enabled, meta } = args;
  if (variant !== 'ambient') return url;

  return formatVideoTransformURL({ src: url, baseURL, enabled, meta });
};
