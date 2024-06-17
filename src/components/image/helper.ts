type BlurOptions = {
  width?: number;
  quality?: number;
  blur?: number;
};

const defaultBlurOptions = {
  width: 64,
  quality: 30,
};

export const formatBlurURL = (path: string, blurOptions?: BlurOptions): string => {
  const searchParams = new URLSearchParams();
  searchParams.set("url", path);
  searchParams.set("w", `${blurOptions?.width ?? defaultBlurOptions.width}`);
  searchParams.set("q", `${blurOptions?.quality ?? defaultBlurOptions.quality}`);
  if (blurOptions?.blur !== undefined) {
    searchParams.set("blur", `${blurOptions.blur}`);
  }

  return `/_next/image?${searchParams.toString()}`;
};
