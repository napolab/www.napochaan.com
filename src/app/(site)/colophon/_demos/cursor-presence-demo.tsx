'use client';

import { useEffect, useMemo } from 'react';

import { CursorLayer } from '@components/cursor-presence/cursor-layer';
import { readCursorColor } from '@components/cursor-presence/read-cursor-color';

import { createSampleVisitorApp } from './sample-visitor-app';
import * as styles from './cursor-presence-demo.css';

// The real CursorLayer, fed a socket-free sample engine (createSampleVisitorApp) and
// filling the cell. With no Placement/Resizer provider above it, it uses the defaults
// (container placement + container resizer) — so cursors map straight into this box.
// Reuses the actual rendering / lerp path; the demo only supplies + drives the engine.
export const CursorPresenceDemo = () => {
  const app = useMemo(() => createSampleVisitorApp(), []);

  useEffect(() => {
    app.start();

    return () => {
      app.end();
    };
  }, [app]);

  return (
    <div className={styles.frame}>
      <CursorLayer app={app} enabled getColor={readCursorColor} />
    </div>
  );
};
