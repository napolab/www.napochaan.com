import { useEffect, useRef } from 'react';

type RafLoopOptions = {
  fps: number;
  active: boolean;
};

type LoopState = {
  raf: number;
  last: number;
  acc: number;
};

export const useRafLoop = (onFrame: () => void, options: RafLoopOptions): void => {
  const { fps, active } = options;
  const frameInterval = 1000 / fps;

  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  const loopStateRef = useRef<LoopState>({ raf: 0, last: 0, acc: 0 });

  useEffect(() => {
    // USEEFFECT_JUSTIFICATION: Required for rAF loop lifecycle management (start/stop on active change)
    if (!active) {
      cancelAnimationFrame(loopStateRef.current.raf);
      loopStateRef.current.raf = 0;
      loopStateRef.current.last = 0;
      loopStateRef.current.acc = 0;
      return;
    }

    const state = loopStateRef.current;
    state.last = 0;
    state.acc = 0;

    const tick = (t: number) => {
      const s = loopStateRef.current;
      if (s.last === 0) s.last = t;
      s.acc += t - s.last;
      s.last = t;
      if (s.acc >= frameInterval) {
        s.acc %= frameInterval;
        onFrameRef.current();
      }
      s.raf = requestAnimationFrame(tick);
    };

    state.raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(loopStateRef.current.raf);
      loopStateRef.current.raf = 0;
    };
  }, [active, frameInterval]);
};
