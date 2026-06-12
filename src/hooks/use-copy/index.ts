'use client';

import { useCallback, useEffect, useState } from 'react';

type UseCopy = {
  copied: boolean;
  copy: () => Promise<void>;
};

// Copy `text` to the clipboard and expose a transient `copied` flag that
// auto-resets after `resetMs`. The timer is keyed on `copied` so each copy
// restarts it; the cleanup clears it to avoid a post-unmount state update.
export const useCopy = (text: string, resetMs = 2000): UseCopy => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), resetMs);
    return () => clearTimeout(timer);
  }, [copied, resetMs]);

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
  }, [text]);

  return { copied, copy };
};
