'use client';

import { useCallback } from 'react';

import { useAutoResetState } from '@hooks/use-auto-reset-state';
import { COPIED_RESET_MS, shareOrCopy } from '@utils/share';

type UseShareResult = {
  // True for a transient window after the clipboard fallback writes successfully.
  copied: boolean;
  share: () => Promise<void>;
};

// Share `data` through the Web Share API, falling back to writing `fallbackText` to the
// clipboard when native sharing is unavailable or fails (@utils/share, shared with the
// <share-bar> element). On a successful clipboard fallback, `copied` flips true for a
// transient window so a caller can show a confirmation. Pass a stable (memoized) `data`.
export const useShare = (data: ShareData, fallbackText: string): UseShareResult => {
  const [copied, setCopied] = useAutoResetState(false, COPIED_RESET_MS);

  const share = useCallback(async () => {
    if ((await shareOrCopy(data, fallbackText)) === 'copied') setCopied(true);
  }, [data, fallbackText, setCopied]);

  return { copied, share };
};
