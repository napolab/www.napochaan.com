import { headers } from 'next/headers';

import 'server-only';

const REQUEST_URL_HEADER = 'x-req-url';

const FALLBACK_ORIGIN = 'https://www.napochaan.com';

const ALLOWED_ORIGINS = new Set(['https://www.napochaan.com', 'https://stg.napochaan.com', 'http://localhost:3000', 'http://localhost:8787', 'http://localhost:8788']);

export const getRequestOrigin = async (): Promise<string> => {
  // In production builds we resolve the origin from BASE_URL so that calling
  // code avoids `headers()` and pages stay eligible for static / ISR caching.
  // The header-based branch is dead-code-eliminated once NODE_ENV is inlined.
  if (process.env.NODE_ENV === 'production') {
    return process.env.BASE_URL ?? FALLBACK_ORIGIN;
  }

  const headersList = await headers();
  const url = headersList.get(REQUEST_URL_HEADER);

  if (url !== null) {
    const origin = new URL(url).origin;
    if (ALLOWED_ORIGINS.has(origin)) return origin;
  }

  return process.env.BASE_URL ?? FALLBACK_ORIGIN;
};
