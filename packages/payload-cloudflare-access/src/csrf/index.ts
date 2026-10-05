// Mirrors the `cookie` extraction method of Payload 3.84.1 (`dist/auth/extractJWT.js`).
const ALLOWED_FETCH_SITES = ['same-origin', 'same-site', 'none'];

export const isAllowedCookieRequest = (headers: Headers, csrf: readonly string[]): boolean => {
  const origin = headers.get('Origin');
  if (origin !== null && origin !== '') return csrf.length === 0 || csrf.includes(origin);
  if (csrf.length === 0) return true;

  const fetchSite = headers.get('Sec-Fetch-Site');
  return fetchSite !== null && ALLOWED_FETCH_SITES.includes(fetchSite);
};
