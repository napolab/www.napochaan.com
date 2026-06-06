import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

import { deriveIdentity } from '../../src/lib/cursor/identity';

const connect = async (room: string, uid: string): Promise<WebSocket> => {
  const stub = env.CURSOR_ROOM.get(env.CURSOR_ROOM.idFromName(room));
  const url = new URL(`/rooms/${room}`, 'https://cursor.do');
  url.searchParams.set('uid', uid);
  const res = await stub.fetch(new Request(url, { headers: { Upgrade: 'websocket' } }));
  const ws = res.webSocket;
  if (!ws) throw new Error('no webSocket on response');
  ws.accept();
  return ws;
};

const nextMessage = (ws: WebSocket): Promise<string> => new Promise((resolve) => ws.addEventListener('message', (e) => resolve(`${e.data}`), { once: true }));

describe('CursorRoom', () => {
  it('sends welcome with derived identity on connect', async () => {
    const ws = await connect('p1', 'a3f29b10c4d5e6f7');
    const msg = JSON.parse(await nextMessage(ws));
    expect(msg.t).toBe('welcome');
    expect(msg.self).toEqual(deriveIdentity('a3f29b10c4d5e6f7'));
  });

  it('broadcasts move to others but not back to sender', async () => {
    const a = await connect('p2', 'aaaa1111bbbb2222');
    const b = await connect('p2', 'cccc3333dddd4444');
    a.send(JSON.stringify({ t: 'move', nx: 0.3, ny: 0.7 }));
    const seen: string[] = [];
    b.addEventListener('message', (e) => seen.push(`${e.data}`));
    await new Promise((r) => setTimeout(r, 50));
    const moves = seen.map((s) => JSON.parse(s)).filter((m) => m.t === 'move');
    expect(moves.at(-1)).toMatchObject({ t: 'move', id: 'aaaa1111bbbb2222', nx: 0.3, ny: 0.7 });
  });
});
