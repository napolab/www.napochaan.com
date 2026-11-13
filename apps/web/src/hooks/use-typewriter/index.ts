'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

import { usePrefersReducedMotion } from '@hooks/use-prefers-reduced-motion';
import { TYPEWRITER_DEFAULTS, createTypewriter } from '@utils/typewriter';

import type { TypewriterSnapshot } from '@utils/typewriter';

type UseTypewriterOptions = {
  speed?: number;
  jitter?: number;
  typoChance?: number;
  pauseChance?: number;
  startWhen?: boolean;
};

// React binding of the framework-free typewriter controller (@utils/typewriter, shared
// with the <typewriter-text> / <boot-question> custom elements): an external store
// read via useSyncExternalStore.
export const useTypewriter = (fullText: string, options: UseTypewriterOptions = {}): TypewriterSnapshot => {
  const {
    speed = TYPEWRITER_DEFAULTS.speed,
    jitter = TYPEWRITER_DEFAULTS.jitter,
    typoChance = TYPEWRITER_DEFAULTS.typoChance,
    pauseChance = TYPEWRITER_DEFAULTS.pauseChance,
    startWhen = true,
  } = options;
  const [controller] = useState(() => createTypewriter(fullText, { speed, jitter, typoChance, pauseChance }));
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getServerSnapshot);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    // USEEFFECT_JUSTIFICATION: imperative typewriter timer — starts the reveal on
    // mount (jumping to the full text under reduced-motion) and clears it on unmount.
    if (!startWhen) return;
    if (reduced) {
      controller.finish();
      return;
    }
    controller.start();
    return controller.stop;
  }, [controller, startWhen, reduced]);

  return snapshot;
};
