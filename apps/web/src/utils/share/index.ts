// Framework-free share-then-clipboard, shared by the React useShare hook (ShareBar /
// QuoteShare islands) and the `<share-bar>` custom element. One module, so the
// fallback rules never drift.

// Attempt the Web Share API. Returns true when the native path handled the share — it
// either completed, or the user dismissed the sheet (an AbortError, a normal cancel).
// Returns false when the API is absent (desktop Firefox, some desktop Chrome) or failed
// for a real reason, signalling the caller to fall back.
const shareNatively = async (data: ShareData): Promise<boolean> => {
  if (typeof navigator.share !== 'function') return false;
  try {
    await navigator.share(data);
    return true;
  } catch (error) {
    return error instanceof DOMException && error.name === 'AbortError';
  }
};

// How long a caller shows its "copied" confirmation after the clipboard fallback.
export const COPIED_RESET_MS = 2000;

export type ShareOutcome = 'shared' | 'copied';

// Shares `data` through the Web Share API, falling back to writing `fallbackText` to
// the clipboard when native sharing is unavailable or fails. Resolves 'copied' only
// after the clipboard fallback wrote successfully (a caller then shows a transient
// confirmation); a clipboard failure rejects.
export const shareOrCopy = async (data: ShareData, fallbackText: string): Promise<ShareOutcome> => {
  if (await shareNatively(data)) return 'shared';
  await navigator.clipboard.writeText(fallbackText);
  return 'copied';
};
