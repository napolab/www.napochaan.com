'use client';

import { useEffect, useRef, useState } from 'react';

import * as styles from './styles.css';

type Props = {
  // 2-digit reference number for the blank.
  refLabel: string;
};

type Size = { width: number; height: number };

// The masonry layout is fixed entirely by CSS, but a blank's on-screen pixel size is
// only known at runtime. This tiny client island measures its own (already CSS-sized)
// cell and prints it as a "W×H" dimension callout. Purely cosmetic — absolutely
// positioned and aria-hidden — so the runtime measurement never shifts the layout.
export const BlankDim = ({ refLabel }: Props) => {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [size, setSize] = useState<Size | null>(null);

  useEffect(() => {
    // USEEFFECT_JUSTIFICATION: imperative ResizeObserver — reads the CSS-sized cell to
    // label it; affects only this aria-hidden text, never layout.
    const el = ref.current;
    if (el === null) return;

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect !== undefined) setSize({ width: Math.round(rect.width), height: Math.round(rect.height) });
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const measured = size !== null && size.width > 0;

  return (
    <span ref={ref} className={styles.blankDim} aria-hidden="true">
      {measured ? `${size.width}×${size.height}\nNO.${refLabel}` : `NO.${refLabel}`}
    </span>
  );
};
