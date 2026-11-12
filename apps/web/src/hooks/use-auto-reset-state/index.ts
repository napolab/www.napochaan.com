'use client';

import { useCallback, useEffect, useState } from 'react';

// A `useState`-shaped hook whose value automatically returns to `initial` after
// `resetMs`. Works for any value (boolean confirmation flags, transient labels,
// counts…). Pass a stable primitive `initial` — equality with it (`===`) is what
// decides whether a reset timer is pending, so an inline object/array would loop.
export const useAutoResetState = <T>(initial: T, resetMs = 2000): [T, (next: T) => void] => {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    if (value === initial) return;
    const timer = setTimeout(() => setValue(initial), resetMs);
    return () => clearTimeout(timer);
  }, [value, initial, resetMs]);

  const set = useCallback((next: T) => setValue(next), []);

  return [value, set];
};
