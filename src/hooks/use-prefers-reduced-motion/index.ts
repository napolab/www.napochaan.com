'use client';

import { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import { prefersReducedMotion, subscribeReducedMotion } from '@utils/prefers-reduced-motion';

const getServerSnapshot = (): boolean => false;

// Live uncontrolled snapshot of the effective preference (override + OS).
export const useReducedMotionSnapshot = (): boolean => useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, getServerSnapshot);

export type MotionValue = {
  reduced: boolean;
  toggle: () => void;
};

// Set by MotionProvider so a controlled `reduced` prop (tests / external control)
// can override the uncontrolled snapshot for every consumer below it.
export const MotionContext = createContext<MotionValue | null>(null);

const noop = (): void => {};

// Effective reduced-motion preference. Prefers the provider's value (which honors a
// controlled prop); falls back to the live snapshot when no provider is mounted, so
// the hook keeps working in isolation (e.g. component tests, standalone demos).
export const usePrefersReducedMotion = (): boolean => {
  const context = useContext(MotionContext);
  const snapshot = useReducedMotionSnapshot();

  return context === null ? snapshot : context.reduced;
};

// Reduced-motion value plus the toggle, for UI controls (the header switch). Falls
// back to a read-only snapshot + no-op toggle when no provider is mounted.
export const useMotion = (): MotionValue => {
  const context = useContext(MotionContext);
  const snapshot = useReducedMotionSnapshot();
  const value = useMemo(() => ({ reduced: snapshot, toggle: noop }), [snapshot]);

  return useMemo(() => (context === null ? value : context), [value, context]);
};
