// Candidate widths for the responsive srcset. Every image sits in the ≤1180px
// content column, so the largest 2× candidate is 2048 (apps/web next.config
// `images.deviceSizes`).
export const IMAGE_WIDTHS = [640, 750, 828, 1080, 1200, 1920, 2048] as const;

export const DEFAULT_IMAGE_QUALITY = 75;

// The worker serves this path through the IMAGES binding (worker/handlers/images);
// cache policy and `formatBlurURL` already key on it.
const IMAGE_ENDPOINT = '/_next/image';

type ImageSourceArgs = { src: string; quality?: number; unoptimized?: boolean };

export type ImageSources = { src: string; srcSet: string | undefined };

export const optimizedImageURL = (src: string, width: number, quality: number): string => `${IMAGE_ENDPOINT}?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;

// Inline sources cannot go through the optimizer.
const isInlineSource = (src: string): boolean => src.startsWith('data:') || src.startsWith('blob:');

export const buildImageSources = ({ src, quality = DEFAULT_IMAGE_QUALITY, unoptimized = false }: ImageSourceArgs): ImageSources => {
  if (unoptimized || isInlineSource(src)) return { src, srcSet: undefined };

  const srcSet = IMAGE_WIDTHS.map((width) => `${optimizedImageURL(src, width, quality)} ${width}w`).join(', ');
  const largest = IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1] ?? 2048;

  return { src: optimizedImageURL(src, largest, quality), srcSet };
};
