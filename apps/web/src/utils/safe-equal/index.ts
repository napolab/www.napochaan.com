// Constant-time over the longer input: a length mismatch is folded into the accumulator
// instead of returning early, so timing does not reveal how much of the prefix matched.
// Ported from apps/cms/src/services/preview.
export const safeEqual = (a: string, b: string): boolean => {
  const length = Math.max(a.length, b.length);
  const diff = Array.from({ length }, (_, index) => (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0)).reduce((acc, bit) => acc | bit, a.length ^ b.length);

  return diff === 0;
};

// Shared-secret check. An unset/empty configured secret must never authorize — otherwise
// an empty submission would match it.
export const matchesSecret = (submitted: string | undefined, expected: string | undefined): boolean => {
  if (expected === undefined || expected === '') return false;
  if (submitted === undefined) return false;

  return safeEqual(submitted, expected);
};
