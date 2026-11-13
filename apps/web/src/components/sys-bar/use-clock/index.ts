import { useCallback, useSyncExternalStore } from 'react';

import { getClock, subscribeClock } from '../clock-store';

// Headless live-clock hook over the framework-free clock store (../clock-store, shared
// with the <sys-bar> element) and returns the current HH:mm:ss string.
// `initialTime` is the time stamped by the server parent; the server render and the
// matching hydration pass return it verbatim, so SSR shows a real clock right
// away with no placeholder and no hydration mismatch. After hydration the store
// takes over and the value ticks live.
export const useClock = (initialTime: string): string => {
  const getServerSnapshot = useCallback(() => initialTime, [initialTime]);

  return useSyncExternalStore(subscribeClock, getClock, getServerSnapshot);
};
