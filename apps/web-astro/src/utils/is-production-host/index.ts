// The canonical production hosts. Both the apex and the www host count as
// production; everything else (localhost, stg.napochaan.com, unknown preview
// hosts) is non-production and must be de-indexed. Driving robots.txt / meta
// `noindex` off an explicit allowlist fails closed: an unexpected BASE_URL never
// accidentally exposes a non-production deploy to crawlers.
const PRODUCTION_HOSTS = new Set(['napochaan.com', 'www.napochaan.com']);

// Accepts a full origin or URL (e.g. BASE_URL, a request origin) and reports
// whether it points at the production site.
export const isProductionHost = (url: string): boolean => {
  return PRODUCTION_HOSTS.has(new URL(url).hostname);
};
