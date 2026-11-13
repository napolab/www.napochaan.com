'use client';

import { useEffect, useMemo } from 'react';

import { MotionContext, useReducedMotionSnapshot } from '@hooks/use-prefers-reduced-motion';
import { toggleMotion, writeMotionPlay } from '@utils/motion-toggle';

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
  const snapshot = useReducedMotionSnapshot();
  const reduced = controlled ?? snapshot;

  useEffect(() => {
    // USEEFFECT_JUSTIFICATION: imperative bridge from JS state to CSS (see
    // @utils/motion-toggle writeMotionPlay — the <sys-bar> element keeps it in step on
    // pages without React).
    writeMotionPlay(reduced);
  }, [reduced]);

  // The toggle is framework-free (shared with the <sys-bar> element).
  const value = useMemo<MotionValue>(() => ({ reduced, toggle: toggleMotion }), [reduced]);

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
};
