'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { read, subscribe, write } from '@utils/persistent-store';

// A JSON-serializable value persisted in localStorage, read synchronously via useSyncExternalStore so
// there is no post-mount flash and no hydration mismatch (the server snapshot is the fallback).
// Storage failures never throw — an in-session cache keeps the tab consistent.
export const usePersistent = <T>(key: string, fallback: T): readonly [T, (next: T) => void] => {
  const getSnapshot = useCallback((): T => read(key, fallback), [key, fallback]);
  const getServerSnapshot = useCallback((): T => fallback, [fallback]);
  const subscribeToKey = useCallback((listener: () => void) => subscribe(key, listener), [key]);

  const value = useSyncExternalStore(subscribeToKey, getSnapshot, getServerSnapshot);
  const setValue = useCallback((next: T) => write(key, next), [key]);

  return [value, setValue];
};
