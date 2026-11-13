'use client';

import { createContext, useContext } from 'react';

export type PresenceValue = {
  count: number;
  enabled: boolean;
  toggle: () => void;
};

const PresenceContext = createContext<PresenceValue | null>(null);

export const PresenceContextProvider = PresenceContext.Provider;

export const usePresence = (): PresenceValue => {
  const value = useContext(PresenceContext);
  if (value === null) return { count: 0, enabled: true, toggle: () => undefined };

  return value;
};
