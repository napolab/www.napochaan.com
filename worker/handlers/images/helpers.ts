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
