'use client';

import { usePathname } from '@lib/navigation';
import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore, type ReactNode } from 'react';

import { usePersistent } from '@hooks/use-persistent';
import { createLazyVisitorPointerApp } from '@lib/cursor/lazy-visitor-pointer-app';
import { defineCache } from '@utils/define-cache';

import { bindPointerSend } from './bind-pointer-send';
import { CursorLayer } from './cursor-layer';
import { createSurfacePlacement } from './placement';
import { PlacementProvider } from './placement-context';
import { PRESENCE_ENABLED_KEY, publishPresenceCount } from './presence-count';
import { readCursorColor } from './read-cursor-color';
import { resolveSurface } from './resolve-surface';
import * as styles from './styles.css';
import { SurfaceRefProvider } from './surface-context';
import { trackSurface } from './track-surface';

import type { Rect } from '@lib/cursor/coordinate';
import type { SurfaceTracker } from './track-surface';

// The React CursorPresence (one React tree with its CursorSurface child, and the
// reference markup for cursor-presence.astro). The site runs the <cursor-presence>
// element (./element.ts), which shares the surface tracker, the pointer sender and the
// canvas loop (./track-surface, ./bind-pointer-send, ./bind-cursor-layer) with this one.

// Defer start() past React StrictMode's synchronous mount→unmount→remount in dev. The throwaway
// first mount's timer is cleared before it fires, so only the surviving mount opens a socket.
const START_DELAY_MS = 100;

export const CursorPresence = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const app = useMemo(() => createLazyVisitorPointerApp(), []);

  const [enabled] = usePersistent(PRESENCE_ENABLED_KEY, true);
  const enabledRef = useRef(enabled);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const trackerRef = useRef<SurfaceTracker | null>(null);

  enabledRef.current = enabled;

  const state = useSyncExternalStore(app.subscribe, app.getState, app.getState);

  useEffect(() => {
    if (!enabled) return; // disabled: opt out of presence entirely — no socket, not counted by peers
    const timer = setTimeout(() => app.start(), START_DELAY_MS);

    return () => {
      clearTimeout(timer);
      app.end();
    };
  }, [app, enabled]);

  useEffect(() => {
    // Use the pathname as the presence channel so the server routes per route over the single socket.
    app.setChannel(pathname);
  }, [app, pathname]);

  const getRect = useCallback((): Rect | null => trackerRef.current?.getRect() ?? null, []);

  useEffect(() => {
    const tracker = trackSurface(() => resolveSurface(surfaceRef.current));
    trackerRef.current = tracker;

    return () => {
      tracker.dispose();
      trackerRef.current = null;
    };
  }, []);

  useEffect(() => bindPointerSend({ app, getRect, isEnabled: () => enabledRef.current }), [app, getRect]);

  useEffect(() => {
    // Publish to the module-level presence store so the SysBar sees it.
    publishPresenceCount(state.count);
  }, [state.count]);

  useEffect(() => () => publishPresenceCount(0), []);

  const getColor = useMemo(() => defineCache(readCursorColor), []);
  // Surface-anchored placement: cursors follow page content as it scrolls.
  const placement = useMemo(() => createSurfacePlacement(getRect), [getRect]);

  return (
    <SurfaceRefProvider value={surfaceRef}>
      {children}
      <PlacementProvider value={placement}>
        <div className={styles.overlay}>
          <CursorLayer app={app} enabled={enabled} getColor={getColor} />
        </div>
      </PlacementProvider>
    </SurfaceRefProvider>
  );
};
