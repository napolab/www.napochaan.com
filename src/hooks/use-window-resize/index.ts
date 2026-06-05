import { useEffect, useRef } from 'react';

export const useWindowResize = (onResize: () => void): void => {
  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;

  useEffect(() => {
    // USEEFFECT_JUSTIFICATION: Required for window resize event listener lifecycle
    const handler = () => {
      onResizeRef.current();
    };

    handler();
    window.addEventListener('resize', handler, { passive: true });

    return () => {
      window.removeEventListener('resize', handler);
    };
  }, []);
};
