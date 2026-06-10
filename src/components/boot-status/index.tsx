'use client';

import { createContext, use, useCallback, useState, useSyncExternalStore } from 'react';

import { createBootStore } from './store';

import type { BootSnapshot, BootStore } from './store';
import type { ReactNode } from 'react';

// Default store for trees with no provider (e.g. error routes): observes the
// document root. Safe at module scope — createBootStore only touches the DOM
// inside subscribe (client-only).
const defaultStore = createBootStore();

const BootStatusContext = createContext<BootStore>(defaultStore);

type ProviderProps = {
  children: ReactNode;
  // Observed element. Defaults to the document root; injected in tests.
  target?: HTMLElement;
};

// Owns ONE store instance per tree (instance-scoped via useState — no module
// singleton, so tests stay isolated and can inject `target`). Mounted once at the
// site layout root so every intro animation under it shares this store.
export const BootStatusProvider = ({ children, target }: ProviderProps) => {
  const [store] = useState(() => createBootStore(target));

  return <BootStatusContext value={store}>{children}</BootStatusContext>;
};

const SERVER: BootSnapshot = { ready: false };

// Subscribe to boot status with a selector over the store snapshot. The observed
// element is held privately by the store, so the server snapshot stays
// well-defined ({ ready: false } during boot) and hydration matches.
export const useBootStatus = <T,>(selector: (snapshot: BootSnapshot) => T): T => {
  const store = use(BootStatusContext);
  const getSnapshot = useCallback(() => selector(store.getSnapshot()), [store, selector]);
  const getServerSnapshot = useCallback(() => selector(SERVER), [selector]);

  return useSyncExternalStore(store.subscribe, getSnapshot, getServerSnapshot);
};

const selectReady = (snapshot: BootSnapshot) => snapshot.ready;

// Convenience: most intro animations only need the boolean.
export const useBootReady = (): boolean => useBootStatus(selectReady);
