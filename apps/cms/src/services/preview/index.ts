import type { CMSServices } from '@napochaan/cms-api/services';

// Constant-time over the longer input: length mismatch is folded into the
// accumulator instead of returning early, so timing does not reveal the prefix.
export const safeEqual = (a: string, b: string): boolean => {
  const length = Math.max(a.length, b.length);
  const diff = Array.from({ length }, (_, index) => (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0)).reduce((acc, bit) => acc | bit, a.length ^ b.length);

  return diff === 0;
};

export const createPreviewService = (expected: string | undefined): CMSServices['preview'] => ({
  verify(secret) {
    if (!expected) return false;

    return safeEqual(secret, expected);
  },
});
