// Public media URLs keep the historical `/api/media/file/<filename>` shape; the
// originals are served by the cms Worker at `/media/:filename` over the `CMS`
// Service Binding. Shared by the worker image handler and the OG image loader.
const PUBLIC_MEDIA_PREFIX = '/api/media/file/';

// The Service Binding ignores the host; it only has to form a valid URL.
const CMS_BINDING_ORIGIN = 'https://cms.internal';

const safeDecode = (segment: string): string | undefined => {
  try {
    return decodeURIComponent(segment);
  } catch {
    return undefined;
  }
};

// Decoded filename of a public media pathname (still percent-encoded, as in
// `URL.pathname`), or undefined for non-media / empty / malformed paths.
export const mediaFilenameOf = (pathname: string): string | undefined => {
  if (!pathname.startsWith(PUBLIC_MEDIA_PREFIX)) return undefined;

  const segment = pathname.slice(PUBLIC_MEDIA_PREFIX.length);
  if (segment === '') return undefined;

  return safeDecode(segment);
};

// Request for the cms media route. The filename is encoded exactly once so it
// stays a single path segment.
export const cmsMediaRequest = (filename: string): Request => new Request(`${CMS_BINDING_ORIGIN}/media/${encodeURIComponent(filename)}`);
