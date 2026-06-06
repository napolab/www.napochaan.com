import { useSyncExternalStore } from 'react';

import { dayjs } from '@utils/dayjs';

const formatNow = () => dayjs().tz('Asia/Tokyo').format('HH:mm:ss');

const listeners = new Set<() => void>();
// Subscription store for useSyncExternalStore: a const cell object holds the
// cached snapshot and the shared interval handle (mutated, never reassigned).
const clockStore: { current: string; timer: ReturnType<typeof setInterval> | undefined } = {
  current: '--:--:--',
  timer: undefined,
};

const emit = () => {
  clockStore.current = formatNow();
  for (const listener of listeners) listener();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  if (clockStore.timer === undefined) clockStore.timer = setInterval(emit, 1000);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && clockStore.timer !== undefined) {
      clearInterval(clockStore.timer);
      clockStore.timer = undefined;
    }
  };
};

const getSnapshot = () => clockStore.current;
const getServerSnapshot = () => '--:--:--';

// Headless live-clock hook: shares a single 1s interval across all subscribers
// (cleared when the last unsubscribes) and returns the current HH:mm:ss string.
export const useClock = (): string => {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
