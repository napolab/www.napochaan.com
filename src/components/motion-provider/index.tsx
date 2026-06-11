'use client';

import { useCallback, useEffect, useMemo } from 'react';

import { usePersistent } from '@hooks/use-persistent';
import { MotionContext, useReducedMotionSnapshot } from '@hooks/use-prefers-reduced-motion';
import { writeMotionCookie } from '@utils/motion-cookie';
import { MOTION_STORAGE_KEY } from '@utils/prefers-reduced-motion';

import type { MotionValue } from '@hooks/use-prefers-reduced-motion';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  // Controlled override: when provided, this is the effective value for every
  // consumer below, regardless of the stored preference or OS setting (tests /
  // external control). When omitted, the provider is uncontrolled (override + OS).
  reduced?: boolean;
};

// Supplies the effective reduced-motion preference (and the toggle) to the tree.
// Uncontrolled: the persisted user override (set via the toggle) wins over the OS
// setting; with no override yet, it follows the OS. The whole `reduced` value can
// be forced via the controlled prop.
export const MotionProvider = ({ children, reduced: controlled }: Props) => {
  const [, setOverride] = usePersistent<boolean | null>(MOTION_STORAGE_KEY, null);
  const snapshot = useReducedMotionSnapshot();
  const reduced = controlled ?? snapshot;

  // Flip the effective motion state: store the explicit "motion enabled" boolean
  // that is the opposite of the current motion-on — i.e. the current `reduced`.
  const toggle = useCallback(() => {
    setOverride(snapshot);
    writeMotionCookie(snapshot);
  }, [snapshot, setOverride]);

  useEffect(() => {
    // USEEFFECT_JUSTIFICATION: imperative bridge from JS state to CSS. Pure-CSS
    // animations read `var(--motion-play)`; writing it inline on <html> lets the
    // toggle (which can override the OS either way) pause/resume them. Inline beats
    // the stylesheet :root default, so this is the effective source once JS runs.
    document.documentElement.style.setProperty('--motion-play', reduced ? 'paused' : 'running');
  }, [reduced]);

  const value = useMemo<MotionValue>(() => ({ reduced, toggle }), [reduced, toggle]);

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
};
