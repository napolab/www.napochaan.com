export type SitePathResult = { ok: true; path: string } | { ok: false; reason: string };

const describeInput = (input: unknown): string => (typeof input === 'string' ? JSON.stringify(input) : `a ${typeof input}`);

const reject = (input: unknown): SitePathResult => ({
  ok: false,
  reason: `Expected a site-relative path starting with a single "/" (e.g. "/blog"), got ${describeInput(input)}. Other origins, schemes and "//host" paths are not allowed.`,
});

// A single leading `/` (not `//`) and no `\`, which the URL parser reads as `/`.
const looksSiteRelative = (input: string): boolean => input.startsWith('/') && !input.startsWith('//') && !input.includes('\\');

// Agent-supplied paths for the WebMCP tools: same-origin only. The string check alone
// is not enough (the URL parser strips tab / newline, so `/\t/host` becomes `//host`),
// so the resolved origin must also match. The resolved form is returned so fetch /
// location never re-parse a different string than the one that was checked.
export const resolveSitePath = (input: unknown, origin: string): SitePathResult => {
  if (typeof input !== 'string' || !looksSiteRelative(input)) return reject(input);
  const url = new URL(input, origin);
  if (url.origin !== origin) return reject(input);

  return { ok: true, path: `${url.pathname}${url.search}${url.hash}` };
};
