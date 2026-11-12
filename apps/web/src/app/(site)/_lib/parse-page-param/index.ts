// Parse a `/page/[num]` path segment into a page number. Strict canonical form —
// only `1`, `2`, `10`, … — so every page has exactly one URL: leading zeros,
// signs, decimals, and exponents are rejected (`undefined`) instead of coerced,
// which would mint duplicate cacheable URLs for the same content.
export const parsePageParam = (raw: string): number | undefined => {
  if (!/^[1-9][0-9]*$/.test(raw)) return undefined;

  return parseInt(raw, 10);
};
