'use client';

import { useCallback } from 'react';

import { useAutoResetState } from '@hooks/use-auto-reset-state';

// Attempt the Web Share API. Returns true when the native path handled the share —
// it either completed, or the user dismissed the sheet (an AbortError, a normal
// cancel). Returns false when the API is absent (desktop Firefox, some desktop
// Chrome) or failed for a real reason, signalling the caller to fall back.
const shareNatively = async (data: ShareData): Promise<boolean> => {
  if (typeof navigator.share !== 'function') return false;
  try {
    await navigator.share(data);
    return true;
  } catch (error) {
    return error instanceof DOMException && error.name === 'AbortError';
  }
};

type UseShareResult = {
  // True for a transient window after the clipboard fallback writes successfully.
  copied: boolean;
  share: () => Promise<void>;
};

// Share `data` through the Web Share API, falling back to writing `fallbackText`
// to the clipboard when native sharing is unavailable or fails. On a successful
// clipboard fallback, `copied` flips true for a transient window so a caller can
// show a confirmation. Pass a stable (memoized) `data` reference.
export const useShare = (data: ShareData, fallbackText: string): UseShareResult => {
  const [copied, setCopied] = useAutoResetState(false);

  const share = useCallback(async () => {
    if (await shareNatively(data)) return;

    await navigator.clipboard.writeText(fallbackText);
    setCopied(true);
  }, [data, fallbackText, setCopied]);

  return { copied, share };
};
