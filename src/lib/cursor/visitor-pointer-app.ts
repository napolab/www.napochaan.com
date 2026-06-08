'use client';

import { pingWebSocket } from 'durabcast/helpers/client';

import { client } from '../../adapters/client';
import { ServerMessage } from './protocol';
import { createTrailingThrottle } from './trailing-throttle';

import type { CursorColor } from './identity';

// x,y are normalized (nx,ny) in [0,1] relative to the cursor surface, or undefined until the
// visitor's first `move` arrives (a just-joined visitor has no known position yet, so it is not drawn).
export type Visitor = { id: string; color: CursorColor; label: string; x: number | undefined; y: number | undefined };
export type VisitorPointerState = { visitors: ReadonlyMap<string, Visitor>; count: number };

type Listener = (state: VisitorPointerState) => void;
type Unsubscribe = () => void;

export interface VisitorPointerApp {
  // Opens the WebSocket and starts the ping/heartbeat. Idempotent: a second call while already
  // connected is a no-op. Kept out of the factory so the caller controls the socket lifecycle —
  // see the React mount in src/components/cursor-presence for the StrictMode-safe start/end pairing.
  start(): void;
  // Closes the WebSocket and clears every timer. Idempotent: safe to call when not started.
  end(): void;
  // Report the visitor's current page. Sends a `nav` on change (so presence transitions fire even
  // when idle) and re-sends on every socket 'open'; the page also rides on every `move`.
  setPath(path: string): void;
  // Outbound move; THROTTLED internally so a flood of pointermove events does not flood the socket.
  send(position: { x: number; y: number }): void;
  getState(): VisitorPointerState;
  subscribe(listener: Listener): Unsubscribe;
}

// Throttle outbound `move`s to at most one per interval, always sending the latest position via a
// trailing timer, so pointermove (~60/s) doesn't flood the socket.
const MOVE_SEND_INTERVAL_MS = 50;
const PING_INTERVAL_MS = 30_000;

const safeJsonParse = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

// Pure reducer: derives the next state from the current state and a server message. Returns the
// SAME reference when nothing changed, so useSyncExternalStore can rely on identity stability.
export const applyMessage = (state: VisitorPointerState, msg: ServerMessage): VisitorPointerState => {
  switch (msg.t) {
    case 'welcome':
      return state;
    case 'count':
      return { ...state, count: msg.n };
    case 'join': {
      const visitors = new Map(state.visitors);
      const prev = visitors.get(msg.id);
      // No position yet — keep any prior one (rejoin), else leave undefined until the first move.
      visitors.set(msg.id, { id: msg.id, color: msg.color, label: msg.label, x: prev?.x, y: prev?.y });

      return { ...state, visitors };
    }
    case 'move': {
      const prev = state.visitors.get(msg.id);
      if (prev === undefined) return state; // unknown id (no join yet) — ignore
      const visitors = new Map(state.visitors);
      visitors.set(msg.id, { ...prev, x: msg.x, y: msg.y });

      return { ...state, visitors };
    }
    case 'leave': {
      if (!state.visitors.has(msg.id)) return state;
      const visitors = new Map(state.visitors);
      visitors.delete(msg.id);

      return { ...state, visitors };
    }
  }
};

export const createVisitorPointerApp = (): VisitorPointerApp => {
  // Single-element holder so `state` can be reassigned without a top-level `let`.
  const store: { state: VisitorPointerState } = { state: { visitors: new Map(), count: 0 } };
  const listeners = new Set<Listener>();

  const getState = (): VisitorPointerState => store.state;

  const setState = (next: VisitorPointerState): void => {
    if (next === store.state) return;
    store.state = next;
    for (const listener of listeners) listener(next);
  };

  const subscribe = (listener: Listener): Unsubscribe => {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  };

  // Socket lifecycle + current page, held individually. `stopPing` tears down durabcast's heartbeat.
  let ws: WebSocket | null = null;
  let stopPing: (() => void) | null = null;
  let path: string | undefined = undefined;

  const isOpen = (socket: WebSocket | null): socket is WebSocket => socket !== null && socket.readyState === socket.OPEN;

  // Page change with no movement; re-sent on every (re)connect so presence re-registers after a drop.
  const sendNav = (): void => {
    if (path !== undefined && isOpen(ws)) ws.send(JSON.stringify({ t: 'nav', path }));
  };
  const handleOpen = (): void => sendNav();
  const setPath = (next: string): void => {
    if (next === path) return;
    path = next;
    sendNav();
  };

  const handleMessage = (event: MessageEvent): void => {
    if (event.data === 'pong') return;
    const json = safeJsonParse(`${event.data}`);
    if (json === undefined) return;
    const parsed = ServerMessage.safeParse(json);
    if (!parsed.success) {
      console.warn('[cursor] invalid server message', parsed.error.message);

      return;
    }
    setState(applyMessage(getState(), parsed.data));
  };

  // Drop all known visitors. On a disconnect the prior roster is stale (peers may have left while we
  // were offline); after reconnect the server replays the current roster in response to our re-nav.
  const resetState = (): void => setState({ visitors: new Map(), count: 0 });
  const handleClose = (): void => resetState();

  // Outbound move throttle: collapses pointermove (~60/s) to one `move` per interval (latest wins).
  // Every move carries the current page so the server can route it (and re-detect page changes).
  const moves = createTrailingThrottle<{ x: number; y: number }>(MOVE_SEND_INTERVAL_MS, (position) => {
    if (path !== undefined && isOpen(ws)) ws.send(JSON.stringify({ t: 'move', path, x: position.x, y: position.y }));
  });

  const send = (position: { x: number; y: number }): void => {
    moves.push(position);
  };

  const start = (): void => {
    if (ws !== null) return; // already started
    ws = client.api.cursors.$ws();
    ws.addEventListener('open', handleOpen);
    ws.addEventListener('message', handleMessage);
    ws.addEventListener('close', handleClose); // reconnecting-websocket fires this on every drop
    // durabcast auto-answers 'ping' with 'pong' (setWebSocketAutoResponse); keep the socket alive.
    stopPing = pingWebSocket(ws, { interval: PING_INTERVAL_MS, ping: 'ping' });
  };

  const end = (): void => {
    if (stopPing !== null) {
      stopPing();
      stopPing = null;
    }
    moves.cancel();
    if (ws === null) return;
    ws.removeEventListener('open', handleOpen);
    ws.removeEventListener('message', handleMessage);
    ws.removeEventListener('close', handleClose);
    ws.close();
    ws = null;
    resetState(); // listener already detached, so clear explicitly for a deliberate stop
  };

  return { start, end, setPath, send, getState, subscribe };
};
