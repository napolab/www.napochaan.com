'use client';

import { useCallback, useEffect, useState } from 'react';

type AutoResetFlag = {
  active: boolean;
  trigger: () => void;
};

// A boolean flag that turns on via `trigger()` and automatically resets to off
// after `resetMs`. Keyed on `active` so each trigger restarts the timer; the
// cleanup clears it to avoid a post-unmount state update.
export const useAutoResetFlag = (resetMs = 2000): AutoResetFlag => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setActive(false), resetMs);
    return () => clearTimeout(timer);
  }, [active, resetMs]);

  const trigger = useCallback(() => setActive(true), []);

  return { active, trigger };
};
