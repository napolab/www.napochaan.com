'use client';

import { useEffect, useRef } from 'react';

import { useResizer } from '@components/canvas-resize';

import { bindCursorLayer } from './bind-cursor-layer';
import { usePlacement } from './placement-context';
import * as styles from './styles.css';

import type { CursorColor } from '@lib/cursor/identity';
import type { VisitorPointerApp } from '@lib/cursor/visitor-pointer-app';

type Props = {
  app: VisitorPointerApp;
  enabled: boolean;
  // Injected by the consumer so this layer stays agnostic of how a cursor color resolves.
  getColor: (color: CursorColor) => string;
};

// The React cursor canvas. The drawing loop is ./bind-cursor-layer, shared with the
// <cursor-presence> element.
export const CursorLayer = ({ app, enabled, getColor }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resizer = useResizer();
  const placement = usePlacement();

  useEffect(() => {
    // USEEFFECT_JUSTIFICATION: imperative rAF canvas loop + app / resize / motion subscriptions
    const canvas = canvasRef.current;
    if (canvas === null) return;

    return bindCursorLayer({ canvas, app, enabled, getColor, placement, resizer });
  }, [app, enabled, getColor, resizer, placement]);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
};
