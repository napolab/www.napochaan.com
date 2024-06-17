"use client";
import NextImage from "next/image";
import { useCallback, useMemo, useState } from "react";

import type { ComponentPropsWithoutRef } from "react";

type Props = ComponentPropsWithoutRef<typeof NextImage>;

const Image = (props: Props) => {
  const [loading, setLoading] = useState(true);
  const handleLoad = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setLoading(false);
      props.onLoad?.(event);
    },
    [props],
  );
  const isPlaceholderBlur = typeof props.blurDataURL === "string" && props.placeholder === "blur";

  const placeholderStyle = useMemo(
    () =>
      typeof props.blurDataURL === "string" && props.placeholder === "blur"
        ? {
            ...props.style,
            backgroundSize: props.style?.objectFit ?? "cover",
            backgroundPosition: props.style?.objectPosition ?? "50% 50%",
            backgroundRepeat: "no-repeat",
            backgroundImage: `url("${props.blurDataURL}")`,
          }
        : {},
    [props.blurDataURL, props.placeholder, props.style],
  );

  return (
    <NextImage
      {...props}
      onLoad={handleLoad}
      alt={props.alt}
      placeholder={isPlaceholderBlur ? "empty" : props.placeholder}
      style={isPlaceholderBlur && loading ? placeholderStyle : props.style}
    />
  );
};

export default Image;
