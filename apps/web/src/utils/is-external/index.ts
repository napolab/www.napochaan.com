// An href is external when it is an absolute http(s) URL. Everything else —
// root-relative routes, fragments, mailto:, etc. — is treated as internal, so
// callers open externals in a new tab and keep internals in the SPA router.
export const isExternal = (href: string): boolean => href.startsWith('http://') || href.startsWith('https://');
