'use client';

import { hc } from 'hono/client';
import ReconnectingWebSocket from 'reconnecting-websocket';

import type { CursorAppType } from '@worker/routes/cursors';

// `location.origin` is read at module load. This 'use client' module is also evaluated in the server
// bundle during SSR, where `window` is undefined — there, resolve the origin from BASE_URL (same env
// the rest of the app uses). The client is only ever *used* in the browser (see start()).
const origin = typeof window === 'undefined' ? (process.env.BASE_URL ?? 'http://localhost:3000') : location.origin;

// Typed Hono RPC client for the worker's app routes. WebSocket transport is reconnecting-websocket
// (maxEnqueuedMessages: 0 = never buffer). Reach any route off this — today only `api.cursors.$ws()`,
// but more routes can be added without changing this module.
export const client = hc<CursorAppType>(origin, {
  webSocket: (url, protocols) => new ReconnectingWebSocket(`${url}`, protocols, { maxEnqueuedMessages: 0 }) as unknown as WebSocket,
});
