'use client';

import { usePathname } from '@lib/navigation';
import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore, type ReactNode } from 'react';

import { usePersistent } from '@hooks/use-persistent';
import { toNormalized, type Rect } from '@lib/cursor/coordinate';
import { createLazyVisitorPointerApp } from '@lib/cursor/lazy-visitor-pointer-app';
import { defineCache } from '@utils/define-cache';

import { CursorLayer } from './cursor-layer';
import { createSurfacePlacement, PlacementProvider } from './placement-context';
import { PRESENCE_ENABLED_KEY, publishPresenceCount } from './presence-store';
import { readCursorColor } from './read-cursor-color';
import { resolveSurface } from './resolve-surface';
import * as styles from './styles.css';
import { SurfaceRefProvider } from './surface-context';

// Defer start() past React StrictMode's synchronous mount→unmount→remount in dev. The throwaway
// first mount's timer is cleared before it fires, so only the surviving mount opens a socket.
const START_DELAY_MS = 100;

const readRect = (el: HTMLElement | null): Rect | null => {
  if (el === null) return null;
  const r = el.getBoundingClientRect();

  return { left: r.left + window.scrollX, top: r.top + window.scrollY, width: r.width, height: r.height };
};

export const CursorPresence = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const app = useMemo(() => createLazyVisitorPointerApp(), []);

  const [enabled] = usePersistent(PRESENCE_ENABLED_KEY, true);
  const enabledRef = useRef(enabled);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const rectRef = useRef<Rect | null>(null);

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

  useEffect(() => {
    // `pathname` changes after every ClientRouter swap (astro:page-load), which
    // re-resolves the freshly swapped-in stage when it is Astro markup.
    const el = resolveSurface(surfaceRef.current);
    const update = (): void => {
      rectRef.current = readRect(el);
    };
    update();
    const observer = new ResizeObserver(update);
    if (el !== null) observer.observe(el);
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [pathname]);

  useEffect(() => {
    if (!matchMedia('(pointer:fine)').matches) return;
    const onMove = (e: PointerEvent): void => {
      const rect = rectRef.current;
      if (rect === null || !enabledRef.current) return;
      const n = toNormalized(rect, e.pageX, e.pageY);
      app.send({ x: n.nx, y: n.ny });
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onMove);
    };
  }, [app]);

  useEffect(() => {
    // Publish to the module-level presence store so other islands (SysBar) see it.
    publishPresenceCount(state.count);
  }, [state.count]);

  useEffect(() => () => publishPresenceCount(0), []);

  const getRect = useCallback((): Rect | null => rectRef.current, []);
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
