// Build a canonical absolute URL from a root-relative path. Reads BASE_URL at
// call time (per-request on the server) so it reflects the deployed host, with
// the same localhost fallback used by robots / llms.txt.
export const absoluteUrl = (path: string): string => {
  const base = process.env.BASE_URL ?? 'http://localhost:3000';
  return new URL(path, base).toString();
};
