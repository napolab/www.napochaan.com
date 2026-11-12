type ExitRedirectOrigins = {
  // The exit-preview request URL; its origin is the web origin itself.
  requestURL: string;
  // The cms origin (env.CMS_ORIGIN). The cms logout chains through here before ending the Access session.
  cmsOrigin: string;
};

const HOME = '/';

const parseURL = (value: string, base?: string): URL | undefined => {
  try {
    return new URL(value, base);
  } catch {
    return undefined;
  }
};

const originOf = (value: string): string | undefined => parseURL(value)?.origin;

// Where `/next/exit-preview` may send the browser after disabling draft mode. Only
// this web origin and the exact cms origin are allowed; everything
// else — other hosts, protocol-relative `//x` / `/\x`, `javascript:` / `data:`,
// look-alike hosts, another scheme or port — falls back to `/`. Origins are
// compared on the parsed URL (never `startsWith`), and the parsed value is
// returned (always absolute) rather than the raw input.
export const resolveExitRedirect = (value: string | null, { requestURL, cmsOrigin }: ExitRedirectOrigins): string => {
  if (value === null || value === '') return HOME;
  const target = parseURL(value, requestURL);
  if (target === undefined) return HOME;

  // Always the absolute href, never a bare path: a same-origin path like `//evil.com`
  // (from `https://<web>//evil.com`, `/.//evil.com`, `/%2e//evil.com`) would be a
  // protocol-relative `Location` and leave the site.
  if (target.origin === originOf(requestURL)) return target.href;
  if (target.origin === originOf(cmsOrigin)) return target.href;

  return HOME;
};
