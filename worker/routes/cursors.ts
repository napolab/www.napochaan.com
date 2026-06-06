import { Hono } from 'hono';
import { defineWebSocketHelper } from 'hono/ws';

import { hashIp } from '../../src/lib/cursor/identity';

type CursorEnv = { Bindings: Cloudflare.Env };

const upgradeToRoom = defineWebSocketHelper<unknown, never>(async (c) => {
  if (c.req.header('Upgrade') !== 'websocket') return;

  const room = c.req.param('room');
  if (room === undefined || room === '') return;

  const ip = c.req.header('cf-connecting-ip') ?? 'anon';
  const uid = await hashIp(ip, c.env.CURSOR_SALT ?? 'dev-salt');

  const stub = c.env.CURSOR_ROOM.get(c.env.CURSOR_ROOM.idFromName(room));
  const doUrl = new URL(`/rooms/${encodeURIComponent(room)}`, 'https://cursor.do');
  doUrl.searchParams.set('uid', uid);

  return stub.fetch(new Request(doUrl, c.req.raw));
});

export const cursorRoutes = new Hono<CursorEnv>().get(
  '/api/cursors/:room',
  upgradeToRoom((_c) => ({})),
);

export type CursorAppType = typeof cursorRoutes;
