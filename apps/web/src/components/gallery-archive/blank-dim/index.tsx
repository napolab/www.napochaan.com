'use client';

import { useEffect, useRef, useState } from 'react';

import { blankDimLabel, roundedSize } from './format';
import * as styles from './styles.css';

import type { BlankSize } from './format';

type Props = {
  // 2-digit reference number for the blank.
  refLabel: string;
};

// The masonry layout is fixed entirely by CSS, but a blank's on-screen pixel size is
// only known at runtime. This tiny client island measures its own (already CSS-sized)
// cell and prints it as a "W×H" dimension callout. Purely cosmetic — absolutely
// positioned and aria-hidden — so the runtime measurement never shifts the layout.
export const BlankDim = ({ refLabel }: Props) => {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [size, setSize] = useState<BlankSize | null>(null);

  useEffect(() => {
    // USEEFFECT_JUSTIFICATION: imperative ResizeObserver — reads the CSS-sized cell to
    // label it; affects only this aria-hidden text, never layout.
    const el = ref.current;
    if (el === null) return;

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect !== undefined) setSize(roundedSize(rect));
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <span ref={ref} className={styles.blankDim} aria-hidden="true">
      {blankDimLabel(refLabel, size)}
    </span>
  );
};
