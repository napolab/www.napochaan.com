import { read, subscribe as subscribePersistent, write } from '@utils/persistent-store';

// Framework-free presence state shared by the <cursor-presence> element (owns the
// socket, publishes the visitor count), the <sys-bar> element (shows `watching N` and
// flips the opt-out) and the React usePresence hook (./presence-store) for the React
// twins. The `enabled` flag lives in the persistent store (localStorage), which is
// already module-scoped, so every consumer stays in sync through it.

export const PRESENCE_ENABLED_KEY = 'cursor-presence-enabled';

const listeners = new Set<() => void>();
const cell = { count: 0 };

// Called from client code only (an element / effect, never during render), so the
// server copy of this module keeps count 0.
export const publishPresenceCount = (count: number): void => {
  if (cell.count === count) return;
  cell.count = count;
  for (const listener of listeners) listener();
};

export const subscribePresenceCount = (listener: () => void): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const getPresenceCount = (): number => cell.count;

export const isPresenceEnabled = (): boolean => read(PRESENCE_ENABLED_KEY, true);

// Reads the store at call time, so a toggle fired from a consumer that has not
// re-rendered yet still flips the latest value.
export const togglePresenceEnabled = (): void => {
  write(PRESENCE_ENABLED_KEY, !isPresenceEnabled());
};

export const subscribePresenceEnabled = (listener: () => void): (() => void) => subscribePersistent(PRESENCE_ENABLED_KEY, listener);
