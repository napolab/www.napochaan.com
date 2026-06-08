import { upgrade } from 'durabcast/helpers/upgrade';
import { Hono } from 'hono';

import { hashIp } from '../../src/lib/cursor/identity';

type CursorEnv = { Bindings: Cloudflare.Env };

/**
 * A 101 Switching-Protocols response that carries an upgraded WebSocket.
 *
 * `Response.webSocket` is a Cloudflare runtime extension (typed via `wrangler types`):
 * `WebSocket | null` on a plain `Response`. `stub.fetch` returns a real `Response`, so the guard
 * narrows "socket present" with no cast — hc's `ClientResponse` drops `webSocket` at runtime, so
 * we forward through the stub directly to keep the real upgraded response.
 */
type WebSocketResponse = Response & { readonly webSocket: WebSocket };

const isWebSocketResponse = (res: Response): res is WebSocketResponse => res.webSocket !== null;

// Every visitor shares ONE Durable Object room; the page is carried per-message and routed in the
// DO. The room is fixed here (not a client-supplied param) so a client cannot target arbitrary DO
// instances or spin up new ones — the only way in is this single global room.
const GLOBAL_ROOM = 'global';

// `upgrade()` (durabcast) replies 426 to non-websocket requests and stamps `outputFormat: 'ws'`
// so the Hono RPC client exposes a typed `$ws`. uid (identity seed) is derived server-side.
export const cursorRoutes = new Hono<CursorEnv>().get('/api/cursors', upgrade(), async (c) => {
  const uid = await hashIp(c.req.header('cf-connecting-ip') ?? 'anon', c.env.CURSOR_SALT ?? 'dev-salt');

  const stub = c.env.CURSOR_ROOM.get(c.env.CURSOR_ROOM.idFromName(GLOBAL_ROOM));
  const doUrl = new URL(`/rooms/${GLOBAL_ROOM}`, c.req.url);
  doUrl.searchParams.set('uid', uid);

  // Forward via stub.fetch with a fresh, headers-only request. Wrapping the in-flight upgrade
  // request breaks the socket, and hc's ClientResponse drops the `webSocket` extension — so go
  // direct, which returns the real DO `Response` with `webSocket` intact.
  const res = await stub.fetch(new Request(doUrl, { headers: c.req.raw.headers }));
  if (!isWebSocketResponse(res)) return new Response('WebSocket upgrade failed', { status: 502 });

  return new Response(null, {
    webSocket: res.webSocket,
    status: res.status,
    headers: res.headers,
    statusText: res.statusText,
  });
});

export type CursorAppType = typeof cursorRoutes;
