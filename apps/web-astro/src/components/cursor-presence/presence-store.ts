'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

import { usePersistent } from '@hooks/use-persistent';
import { read } from '@utils/persistent-store';

// Module-level presence state shared across React roots. Each Astro island is its
// own root: the CursorPresence island owns the socket and publishes the visitor
// count here; the SysBar island reads it (`watching N`) and flips the opt-out. The
// `enabled` flag lives in the persistent store (localStorage), which is already
// module-scoped, so both roots stay in sync through it.

export const PRESENCE_ENABLED_KEY = 'cursor-presence-enabled';

export type PresenceValue = {
  count: number;
  enabled: boolean;
  toggle: () => void;
};

const listeners = new Set<() => void>();
const cell = { count: 0 };

// Called from the CursorPresence island's effect only (never during render), so the
// server copy of this module keeps count 0.
export const publishPresenceCount = (count: number): void => {
  if (cell.count === count) return;
  cell.count = count;
  for (const listener of listeners) listener();
};

const subscribeCount = (listener: () => void): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

const getCount = (): number => cell.count;
const getServerCount = (): number => 0;

export const usePresence = (): PresenceValue => {
  const count = useSyncExternalStore(subscribeCount, getCount, getServerCount);
  const [enabled, setEnabled] = usePersistent(PRESENCE_ENABLED_KEY, true);
  // Read the store at call time rather than closing over `enabled`, so a toggle
  // fired from a root that has not re-rendered yet still flips the latest value.
  const toggle = useCallback(() => setEnabled(!read(PRESENCE_ENABLED_KEY, true)), [setEnabled]);

  return useMemo(() => ({ count, enabled, toggle }), [count, enabled, toggle]);
};
