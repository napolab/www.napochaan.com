const PAYLOAD_MEDIA_PATH = '/api/media/file/';
const ALLOWED_EXTERNAL_HOSTS: string[] = [];

export const isAllowedUrl = (url: URL, origin: string): boolean => {
  if (url.origin === origin) return true;
  return ALLOWED_EXTERNAL_HOSTS.includes(url.host);
};

export const isPayloadMediaPath = (pathname: string): boolean => {
  return pathname.startsWith(PAYLOAD_MEDIA_PATH);
};

export const buildFetchUrl = (url: URL, origin: string): string => {
  if (isPayloadMediaPath(url.pathname)) {
    return `${origin}${url.pathname}${url.search}`;
  }
  return url.toString();
};

export const isInternalAsset = (url: URL, origin: string): boolean => {
  return url.origin === origin && !isPayloadMediaPath(url.pathname);
};

export const isGifSource = (contentType: string | null, pathname: string): boolean => {
  if (contentType !== null && contentType.toLowerCase().startsWith('image/gif')) return true;
  return pathname.toLowerCase().endsWith('.gif');
};

type ExplicitFormat = 'avif' | 'webp' | 'jpeg' | 'png' | 'gif';
type OutputFormat = `image/${ExplicitFormat}`;

type ResolveOutputFormatArgs = {
  explicit: ExplicitFormat | undefined;
  accept: string;
  isGif: boolean;
};

// GIF は avif/jpeg に落とすとアニメーションが失われるため、アニメ保持可能な
// webp(accept にあれば)/ gif に限定して交渉する。
export const resolveOutputFormat = ({ explicit, accept, isGif }: ResolveOutputFormatArgs): OutputFormat => {
  if (explicit !== undefined) return `image/${explicit}`;
  if (isGif) return /image\/webp/.test(accept) ? 'image/webp' : 'image/gif';
  if (/image\/avif/.test(accept)) return 'image/avif';
  if (/image\/webp/.test(accept)) return 'image/webp';
  return 'image/jpeg';
};
