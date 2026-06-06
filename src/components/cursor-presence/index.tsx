'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { toNormalized, type Rect } from '@lib/cursor/coordinate';
import { pathToRoom } from '@lib/cursor/room';

import { CursorLayer, type RemoteCursor } from './cursor-layer';
import { PresenceContextProvider } from './presence-context';
import { useCursorSocket } from './use-cursor-socket';

const STORAGE_KEY = 'cursor-presence-enabled';
const SURFACE_SELECTOR = '[data-cursor-surface]';

const readRect = (): Rect | null => {
  const el = document.querySelector(SURFACE_SELECTOR);
  if (el === null) return null;
  const r = el.getBoundingClientRect();

  return { left: r.left + window.scrollX, top: r.top + window.scrollY, width: r.width, height: r.height };
};

export const CursorPresence = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const room = useMemo(() => pathToRoom(pathname), [pathname]);
  const [enabled, setEnabled] = useState(true);
  const [count, setCount] = useState(0);

  const cursors = useRef<Map<string, RemoteCursor>>(new Map());
  const moveApply = useRef<(id: string, nx: number, ny: number) => void>(() => undefined);
  const presenceApply = useRef<(list: RemoteCursor[]) => void>(() => undefined);
  const rectRef = useRef<Rect | null>(null);
  const enabledRef = useRef(true);
  const rafRef = useRef(0);

  const syncPresence = useCallback(() => {
    if (enabledRef.current) presenceApply.current([...cursors.current.values()]);
    else presenceApply.current([]);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'false') {
      setEnabled(false);
      enabledRef.current = false;
    }
  }, []);

  useEffect(() => {
    const update = (): void => {
      rectRef.current = readRect();
    };
    update();
    const el = document.querySelector(SURFACE_SELECTOR);
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

  const socket = useCursorSocket(room, {
    onMessage: (msg) => {
      switch (msg.t) {
        case 'welcome':
          return;
        case 'join':
          cursors.current.set(msg.id, { id: msg.id, color: msg.color, label: msg.label });
          syncPresence();

          return;
        case 'move':
          moveApply.current(msg.id, msg.nx, msg.ny);

          return;
        case 'leave':
          cursors.current.delete(msg.id);
          syncPresence();

          return;
        case 'count':
          setCount(msg.n);

          return;
      }
    },
  });

  useEffect(() => {
    if (!matchMedia('(pointer:fine)').matches) return;
    const onMove = (e: PointerEvent): void => {
      if (rafRef.current !== 0) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        const rect = rectRef.current;
        if (rect === null || !enabledRef.current) return;
        const n = toNormalized(rect, e.pageX, e.pageY);
        socket.send({ t: 'move', nx: n.nx, ny: n.ny });
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onMove);
      if (rafRef.current !== 0) cancelAnimationFrame(rafRef.current);
    };
  }, [socket]);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      enabledRef.current = next;
      localStorage.setItem(STORAGE_KEY, `${next}`);
      syncPresence();

      return next;
    });
  }, [syncPresence]);

  const value = useMemo(() => ({ count, enabled, toggle }), [count, enabled, toggle]);

  const getRect = useCallback((): Rect | null => rectRef.current, []);
  const registerMove = useCallback((apply: (id: string, nx: number, ny: number) => void): void => {
    moveApply.current = apply;
  }, []);
  const registerPresence = useCallback((apply: (list: RemoteCursor[]) => void): void => {
    presenceApply.current = apply;
  }, []);

  return (
    <PresenceContextProvider value={value}>
      {children}
      <CursorLayer getRect={getRect} registerMove={registerMove} registerPresence={registerPresence} />
    </PresenceContextProvider>
  );
};
