'use client';

import { hc } from 'hono/client';
import { useCallback, useEffect, useRef } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';

import { ServerMessage, type ClientMessage } from '@lib/cursor/protocol';

import type { CursorAppType } from '@worker/routes/cursors';

type Handlers = {
  onMessage: (msg: ServerMessage) => void;
};

export type CursorSocket = {
  send: (msg: ClientMessage) => void;
};

const safeJsonParse = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

export const useCursorSocket = (room: string, handlers: Handlers): CursorSocket => {
  const onMessage = useRef(handlers.onMessage);
  onMessage.current = handlers.onMessage;
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const client = hc<CursorAppType>(location.origin, {
      webSocket: (url, protocols) => new ReconnectingWebSocket(`${url}`, protocols, { maxEnqueuedMessages: 0 }) as unknown as WebSocket,
    });
    const ws = client.api.cursors[':room'].$ws({ param: { room } });
    socketRef.current = ws;

    const ping = setInterval(() => {
      if (ws.readyState === ws.OPEN) ws.send('ping');
    }, 30_000);

    const handleMessage = (event: MessageEvent): void => {
      if (event.data === 'pong') return;
      const json = safeJsonParse(`${event.data}`);
      if (json === undefined) return;
      const parsed = ServerMessage.safeParse(json);
      if (!parsed.success) {
        console.warn('[cursor] invalid server message', parsed.error.message);

        return;
      }
      onMessage.current(parsed.data);
    };

    ws.addEventListener('message', handleMessage);

    return () => {
      clearInterval(ping);
      ws.removeEventListener('message', handleMessage);
      ws.close();
      socketRef.current = null;
    };
  }, [room]);

  const send = useCallback((msg: ClientMessage): void => {
    const ws = socketRef.current;
    if (ws !== null && ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
  }, []);

  return { send };
};
