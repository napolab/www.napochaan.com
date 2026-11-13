import { formatClock } from './format-clock';

// Framework-free live clock shared by the React useClock hook and the <sys-bar> custom
// element: a single 1s interval across all subscribers (cleared when the last one
// leaves). A const cell holds the cached snapshot and the interval handle (mutated,
// never reassigned). Client only — never subscribed on the server.
const listeners = new Set<() => void>();
const clockStore: { current: string; timer: ReturnType<typeof setInterval> | undefined } = {
  current: '--:--:--',
  timer: undefined,
};

const emit = () => {
  clockStore.current = formatClock();
  for (const listener of listeners) listener();
};

export const subscribeClock = (listener: () => void): (() => void) => {
  listeners.add(listener);
  if (clockStore.timer === undefined) {
    // Fill the snapshot synchronously on first subscribe so the first read after it
    // returns the live time immediately, instead of waiting for the first interval
    // tick (~1s). The server-stamped time is what SSR shows; this only governs the
    // switch from that stamped time to the ticking clock.
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

export const getClock = (): string => clockStore.current;
