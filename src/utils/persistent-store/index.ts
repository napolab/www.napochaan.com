// Per-key listeners so every hook instance bound to the same key re-renders on change (this tab via
// the setter, other tabs via the `storage` event). `cache` doubles as the in-session overlay so the
// value survives even when localStorage is unavailable (private mode), and as a parsed-value cache so
// getSnapshot returns a reference-stable value (required by useSyncExternalStore for object values).
const listeners = new Map<string, Set<() => void>>();
const cache = new Map<string, unknown>();

const notify = (key: string): void => {
  for (const listener of listeners.get(key) ?? []) listener();
};

// localStorage access that never throws: undefined on miss or when storage is blocked.
const load = (key: string): string | undefined => {
  try {
    return localStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
};

const save = (key: string, raw: string): void => {
  try {
    localStorage.setItem(key, raw);
  } catch {
    // blocked — the in-session cache keeps this tab consistent
  }
};

const parse = <T>(raw: string, fallback: T): T => {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

// Exported as a primitive so non-React code (e.g. a pure getter read inside an
// imperative animation callback) can read the same persisted value the hook does,
// sharing the in-session cache so the two never disagree.
export const read = <T>(key: string, fallback: T): T => {
  if (cache.has(key)) return cache.get(key) as T;
  const raw = load(key);
  const value = raw === undefined ? fallback : parse(raw, fallback);
  cache.set(key, value); // cache so repeated reads are reference-stable until the value changes

  return value;
};

export const write = <T>(key: string, value: T): void => {
  cache.set(key, value);
  save(key, JSON.stringify(value));
  notify(key);
};

// Exported alongside `read` so external stores can re-render / re-read on the same
// per-key change + cross-tab `storage` events the hook listens to.
export const subscribe = (key: string, listener: () => void): (() => void) => {
  const set = listeners.get(key) ?? new Set<() => void>();
  set.add(listener);
  listeners.set(key, set);

  const onStorage = (event: StorageEvent): void => {
    if (event.key !== key) return;
    cache.delete(key); // another tab changed it — drop the cache so the next read re-parses
    listener();
  };
  window.addEventListener('storage', onStorage);

  return () => {
    set.delete(listener);
    if (set.size === 0) listeners.delete(key); // don't leave empty sets lingering
    window.removeEventListener('storage', onStorage);
  };
};
