import { headers } from 'next/headers';

// The request's own origin (scheme + host). OG image fetches must resolve against
// the server actually handling the request — works in dev on any port and in
// production — rather than the configured BASE_URL (which may differ from the
// port the dev server is on).
export const requestOrigin = async (): Promise<string> => {
  const list = await headers();
  const host = list.get('host') ?? '';
  if (host === '') return process.env.BASE_URL ?? 'http://localhost:3000';

  const proto = host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https';

  return `${proto}://${host}`;
};

// Resolves a possibly-relative media path (e.g. `/api/media/file/x.jpg`) to an
// absolute URL Satori can fetch. Returns undefined for an absent/empty source.
export const absoluteMediaUrl = (src: string | undefined, origin: string): string | undefined => {
  if (src === undefined || src === '') return undefined;
  if (src.startsWith('http://') || src.startsWith('https://')) return src;

  return `${origin}${src}`;
};
