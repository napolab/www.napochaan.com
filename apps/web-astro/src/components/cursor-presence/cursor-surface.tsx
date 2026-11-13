'use client';

import { useSurfaceRef } from './surface-context';

import type { ReactNode } from 'react';

type Props = {
  className?: string;
  children?: ReactNode;
};

// The coordinate reference region for cursor sharing. Attaches the ref shared by CursorPresence so
// the surface element is reachable without `document.querySelector`. Render this inside CursorPresence
// (i.e. as part of its children) in place of a raw `<div data-cursor-surface>`.
export const CursorSurface = ({ className, children }: Props) => {
  const ref = useSurfaceRef();

  return (
    <div ref={ref ?? undefined} data-cursor-surface className={className}>
      {children}
    </div>
  );
};
