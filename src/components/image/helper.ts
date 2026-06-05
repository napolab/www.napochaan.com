type BlurOptions = {
  width?: number;
  quality?: number;
  blur?: number;
};

export const formatBlurURL = (path: string, blurOptions?: BlurOptions): string => {
  const searchParams = new URLSearchParams();
  searchParams.set('url', path);
  searchParams.set('w', `${blurOptions?.width ?? 32}`);
  searchParams.set('q', `${blurOptions?.quality ?? 30}`);
  if (blurOptions?.blur !== undefined) {
    searchParams.set('blur', `${blurOptions.blur}`);
  }

  return `/_next/image?${searchParams.toString()}`;
};
