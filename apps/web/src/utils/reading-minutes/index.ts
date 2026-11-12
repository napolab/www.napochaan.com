// Japanese prose reads at roughly 400–600 chars/min; 500 is a middle estimate.
const CHARS_PER_MINUTE = 500;

/**
 * Estimate reading time in whole minutes (minimum 1) from a plain-text body's
 * character count. Content-agnostic: pass any pre-joined text.
 */
export const readingMinutes = (text: string): number => Math.max(1, Math.ceil(text.length / CHARS_PER_MINUTE));
