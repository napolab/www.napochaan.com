import { useEffect, useMemo, useState } from "react";

import type { RefObject } from "react";

export const useResizeObserver = (
  ref: RefObject<HTMLElement>,
  options?: ResizeObserverOptions,
): ResizeObserverEntry | null => {
  const [mutation, setMutation] = useState<ResizeObserverEntry | null>(null);
  const observer = useMemo(
    () =>
      new ResizeObserver(([m]) => {
        setMutation(m);
      }),
    [],
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    observer.observe(el, options);

    return () => {
      observer.observe(el);
    };
  }, [observer, options, ref]);

  return mutation;
};
