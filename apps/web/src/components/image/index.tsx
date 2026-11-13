'use client';

import { useCallback, useMemo, useState } from 'react';

import { BLUR_ATTRIBUTE } from './blur-script';
import { buildImageSources } from './sources';

import type { ComponentPropsWithoutRef, CSSProperties, SyntheticEvent } from 'react';

type ImgProps = Omit<ComponentPropsWithoutRef<'img'>, 'src' | 'srcSet' | 'width' | 'height' | 'loading' | 'placeholder'>;

export type Props = ImgProps & {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  // Fill the positioned parent (absolute, inset 0) instead of reserving width/height.
  fill?: boolean;
  // Above-the-fold image: eager load + high fetch priority.
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  // Serve `src` as-is (no srcset through the worker images path).
  unoptimized?: boolean;
};

const FILL_STYLE: CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%' };

const resolveSizes = ({ sizes, fill, width }: Pick<Props, 'sizes' | 'fill' | 'width'>): string | undefined => {
  if (sizes !== undefined) return sizes;
  if (fill === true || width === undefined) return '100vw';

  return `${width}px`;
};

const blurPlaceholderStyle = (style: CSSProperties | undefined, blurDataURL: string): CSSProperties => ({
  ...style,
  backgroundSize: style?.objectFit ?? 'cover',
  backgroundPosition: style?.objectPosition ?? '50% 50%',
  backgroundRepeat: 'no-repeat',
  backgroundImage: `url("${blurDataURL}")`,
});

// `<img>` with a responsive srcset through the worker images path
// (`/_next/image`, served by worker/handlers/images) and an optional blur
// placeholder painted as the background until the real image loads. Hydrated, the
// component clears it (onLoad / ref); server-only, imageBlurScriptHtml does.
export const Image = (props: Props) => {
  const { src, width, height, fill, priority, quality, placeholder, blurDataURL, unoptimized, sizes, style, onLoad, ...rest } = props;
  const [loading, setLoading] = useState(true);

  const handleLoad = useCallback(
    (event: SyntheticEvent<HTMLImageElement, Event>) => {
      setLoading(false);
      onLoad?.(event);
    },
    [onLoad],
  );

  // React does not replay a `load` that fired before hydration (SSR markup, cached
  // image), so also clear the placeholder when the element is already complete.
  const handleRef = useCallback((img: HTMLImageElement | null) => {
    if (img === null) return;
    if (img.complete && img.naturalWidth > 0) setLoading(false);
  }, []);

  const sources = useMemo(() => buildImageSources({ src, quality, unoptimized }), [src, quality, unoptimized]);

  const baseStyle = useMemo(() => (fill === true ? { ...FILL_STYLE, ...style } : style), [fill, style]);

  const showBlur = placeholder === 'blur' && blurDataURL !== undefined && loading;

  const resolvedStyle = useMemo(() => {
    if (!showBlur || blurDataURL === undefined) return baseStyle;

    return blurPlaceholderStyle(baseStyle, blurDataURL);
  }, [showBlur, blurDataURL, baseStyle]);

  // Lets imageBlurScriptHtml clear the placeholder when this Image never hydrates.
  const blurMarker = useMemo(() => (showBlur ? { [BLUR_ATTRIBUTE]: '' } : {}), [showBlur]);

  return (
    <img
      {...rest}
      {...blurMarker}
      ref={handleRef}
      src={sources.src}
      srcSet={sources.srcSet}
      sizes={sources.srcSet === undefined ? undefined : resolveSizes({ sizes, fill, width })}
      width={fill === true ? undefined : width}
      height={fill === true ? undefined : height}
      loading={priority === true ? 'eager' : 'lazy'}
      fetchPriority={priority === true ? 'high' : undefined}
      decoding="async"
      style={resolvedStyle}
      onLoad={handleLoad}
    />
  );
};
