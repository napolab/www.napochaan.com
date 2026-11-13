'use client';

import { useMemo, useSyncExternalStore } from 'react';

import { usePersistent } from '@hooks/use-persistent';

import { getPresenceCount, PRESENCE_ENABLED_KEY, subscribePresenceCount, togglePresenceEnabled } from './presence-count';

// React view of the framework-free presence store (./presence-count), for the React
// twins (SysBar reference markup, tests). The custom elements read ./presence-count
// directly.

export type PresenceValue = {
  count: number;
  enabled: boolean;
  toggle: () => void;
};

const getServerCount = (): number => 0;

export const usePresence = (): PresenceValue => {
  const count = useSyncExternalStore(subscribePresenceCount, getPresenceCount, getServerCount);
  const [enabled] = usePersistent(PRESENCE_ENABLED_KEY, true);

  return useMemo(() => ({ count, enabled, toggle: togglePresenceEnabled }), [count, enabled]);
};
