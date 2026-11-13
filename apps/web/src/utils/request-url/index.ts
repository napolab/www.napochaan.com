import { getRequestContext } from '@lib/request-context';

const FALLBACK_ORIGIN = 'https://www.napochaan.com';

const ALLOWED_ORIGINS = new Set(['https://www.napochaan.com', 'https://stg.napochaan.com', 'http://localhost:3000', 'http://localhost:8787', 'http://localhost:8788']);

export const getRequestOrigin = async (): Promise<string> => {
  // In production builds we resolve the origin from BASE_URL so the rendered
  // output never depends on the request host (pages are Workers-Cache'd).
  if (process.env.NODE_ENV === 'production') {
    return process.env.BASE_URL ?? FALLBACK_ORIGIN;
  }

  const origin = new URL(getRequestContext().request.url).origin;
  if (ALLOWED_ORIGINS.has(origin)) return origin;

  return process.env.BASE_URL ?? FALLBACK_ORIGIN;
};
