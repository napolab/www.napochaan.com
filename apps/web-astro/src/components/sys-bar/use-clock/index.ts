import { useCallback, useSyncExternalStore } from 'react';

import { formatClock } from '../format-clock';

const listeners = new Set<() => void>();
// Subscription store for useSyncExternalStore: a const cell object holds the
// cached snapshot and the shared interval handle (mutated, never reassigned).
const clockStore: { current: string; timer: ReturnType<typeof setInterval> | undefined } = {
  current: '--:--:--',
  timer: undefined,
};

const emit = () => {
  clockStore.current = formatClock();
  for (const listener of listeners) listener();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  if (clockStore.timer === undefined) {
    // Fill the snapshot synchronously on first subscribe so the post-hydration
    // read returns the live time immediately, instead of waiting for the first
    // interval tick (~1s). Hydration itself renders getServerSnapshot's stamped
    // time, so this only governs the switch from the stamped time to the ticking
    // clock — never the SSR/hydration match.
    clockStore.current = formatClock();
    clockStore.timer = setInterval(emit, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && clockStore.timer !== undefined) {
      clearInterval(clockStore.timer);
      clockStore.timer = undefined;
    }
  };
};

const getSnapshot = () => clockStore.current;

// Headless live-clock hook: shares a single 1s interval across all subscribers
// (cleared when the last unsubscribes) and returns the current HH:mm:ss string.
// `initialTime` is the time stamped by the RSC parent; the server render and the
// matching hydration pass return it verbatim, so SSR shows a real clock right
// away with no placeholder and no hydration mismatch. After hydration the store
// takes over and the value ticks live.
export const useClock = (initialTime: string): string => {
  const getServerSnapshot = useCallback(() => initialTime, [initialTime]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
