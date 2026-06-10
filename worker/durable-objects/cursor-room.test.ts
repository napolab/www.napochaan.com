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

const nav = (ws: WebSocket, path: string): void => ws.send(JSON.stringify({ t: 'nav', path }));
const settle = (): Promise<void> => new Promise((r) => setTimeout(r, 50));
const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

describe('CursorRoom', () => {
  it('announces a join to existing peers on the same page', async () => {
    const room = 'nav-join';
    const aUid = 'a3f29b10c4d5e6f7';
    const bUid = 'bbbb2222cccc3333';

    const a = await connect(room, aUid);
    nav(a, '/x');
    await settle();

    const seen: string[] = [];
    a.addEventListener('message', (e) => seen.push(`${e.data}`));

    const b = await connect(room, bUid);
    nav(b, '/x');
    await settle();

    const joins = seen.map((s) => JSON.parse(s)).filter((m) => m.t === 'join');
    expect(joins.at(-1)).toEqual({ t: 'join', ...deriveIdentity(bUid) });
  });

  it('replays existing peers to the newcomer', async () => {
    const room = 'nav-replay';
    const aUid = 'aaaa1111bbbb2222';
    const bUid = 'cccc3333dddd4444';

    const a = await connect(room, aUid);
    nav(a, '/x');
    await settle();

    const b = await connect(room, bUid);
    const seen: string[] = [];
    b.addEventListener('message', (e) => seen.push(`${e.data}`));
    nav(b, '/x');
    await settle();

    const joins = seen.map((s) => JSON.parse(s)).filter((m) => m.t === 'join');
    expect(joins).toContainEqual({ t: 'join', ...deriveIdentity(aUid) });
  });

  it('routes move to same-page peers only', async () => {
    const room = 'move-page';
    const aUid = 'aaaa0000bbbb0000';
    const bUid = 'bbbb1111cccc1111';
    const cUid = 'cccc2222dddd2222';

    const a = await connect(room, aUid);
    const b = await connect(room, bUid);
    const c = await connect(room, cUid);
    nav(a, '/x');
    nav(b, '/x');
    nav(c, '/y');
    await settle();

    const bSeen: string[] = [];
    const cSeen: string[] = [];
    b.addEventListener('message', (e) => bSeen.push(`${e.data}`));
    c.addEventListener('message', (e) => cSeen.push(`${e.data}`));

    a.send(JSON.stringify({ t: 'move', path: '/x', x: 0.3, y: 0.7 }));
    await settle();

    const bMoves = bSeen.map((s) => JSON.parse(s)).filter((m) => m.t === 'move');
    const cMoves = cSeen.map((s) => JSON.parse(s)).filter((m) => m.t === 'move');
    expect(bMoves.at(-1)).toMatchObject({ t: 'move', id: aUid, x: 0.3, y: 0.7 });
    expect(cMoves).toHaveLength(0);
  });

  it('does not echo move back to the sender', async () => {
    const room = 'move-noecho';
    const aUid = 'aaaa3333bbbb3333';
    const bUid = 'bbbb4444cccc4444';

    const a = await connect(room, aUid);
    const b = await connect(room, bUid);
    nav(a, '/x');
    nav(b, '/x');
    await settle();

    const aSeen: string[] = [];
    a.addEventListener('message', (e) => aSeen.push(`${e.data}`));

    a.send(JSON.stringify({ t: 'move', path: '/x', x: 0.1, y: 0.2 }));
    await settle();

    const aMoves = aSeen.map((s) => JSON.parse(s)).filter((m) => m.t === 'move');
    expect(aMoves).toHaveLength(0);
  });

  it('emits a leave to old-page peers on navigate-away', async () => {
    const room = 'leave-nav';
    const aUid = 'aaaa5555bbbb5555';
    const bUid = 'bbbb6666cccc6666';

    const a = await connect(room, aUid);
    const b = await connect(room, bUid);
    nav(a, '/x');
    nav(b, '/x');
    await settle();

    const bSeen: string[] = [];
    b.addEventListener('message', (e) => bSeen.push(`${e.data}`));

    nav(a, '/y');
    await settle();

    const leaves = bSeen.map((s) => JSON.parse(s)).filter((m) => m.t === 'leave');
    expect(leaves).toContainEqual({ t: 'leave', id: aUid });
  });

  it('treats a move carrying a new page as a navigation (leave old-page peers)', async () => {
    const room = 'move-transition';
    const aUid = 'aaaa9999bbbb9999';
    const bUid = 'bbbb0000cccc0000';

    const a = await connect(room, aUid);
    const b = await connect(room, bUid);
    nav(a, '/x');
    nav(b, '/x');
    await settle();

    const bSeen: string[] = [];
    b.addEventListener('message', (e) => bSeen.push(`${e.data}`));

    // a moves but reports a different page — the server applies the page change, so b sees a leave.
    a.send(JSON.stringify({ t: 'move', path: '/y', x: 0.4, y: 0.4 }));
    await settle();

    const leaves = bSeen.map((s) => JSON.parse(s)).filter((m) => m.t === 'leave');
    expect(leaves).toContainEqual({ t: 'leave', id: aUid });
  });

  it('keeps the socket on the new page for later moves (no stale-attachment clobber)', async () => {
    const room = 'move-keep-page';
    const aUid = 'aaaaaaaa11112222';
    const bUid = 'bbbbbbbb33334444';

    const a = await connect(room, aUid);
    const b = await connect(room, bUid);
    nav(a, '/x');
    nav(b, '/y');
    await settle();

    const bSeen: string[] = [];
    b.addEventListener('message', (e) => bSeen.push(`${e.data}`));

    // a transitions onto /y (where b is). This is a real navigation.
    a.send(JSON.stringify({ t: 'move', path: '/y', x: 0.4, y: 0.4 }));
    await wait(150);
    // a is already on /y; this must NOT be treated as a new transition.
    a.send(JSON.stringify({ t: 'move', path: '/y', x: 0.5, y: 0.5 }));
    await wait(150);

    const joins = bSeen.map((s) => JSON.parse(s)).filter((m) => m.t === 'join' && m.id === deriveIdentity(aUid).id);
    expect(joins).toHaveLength(1);
  });

  it('throttles rapid moves from the same socket', async () => {
    const room = 'move-throttle';
    const aUid = 'aaaa00ff11ee22dd';
    const bUid = 'bbbb33cc44bb55aa';

    const a = await connect(room, aUid);
    const b = await connect(room, bUid);
    nav(a, '/x');
    nav(b, '/x');
    await settle();

    const bSeen: string[] = [];
    b.addEventListener('message', (e) => bSeen.push(`${e.data}`));

    // Three moves back-to-back within the 100ms window collapse to one broadcast.
    a.send(JSON.stringify({ t: 'move', path: '/x', x: 0.1, y: 0.1 }));
    a.send(JSON.stringify({ t: 'move', path: '/x', x: 0.2, y: 0.2 }));
    a.send(JSON.stringify({ t: 'move', path: '/x', x: 0.3, y: 0.3 }));
    await settle();

    const firstWindow = bSeen.map((s) => JSON.parse(s)).filter((m) => m.t === 'move');
    expect(firstWindow).toHaveLength(1);

    // A 4th move past the throttle window broadcasts again.
    await wait(150);
    a.send(JSON.stringify({ t: 'move', path: '/x', x: 0.4, y: 0.4 }));
    await settle();

    const allMoves = bSeen.map((s) => JSON.parse(s)).filter((m) => m.t === 'move');
    expect(allMoves).toHaveLength(2);
  });

  it('counts presence per page', async () => {
    const room = 'count-page';
    const aUid = 'aaaa7777bbbb7777';
    const bUid = 'bbbb8888cccc8888';

    const a = await connect(room, aUid);
    const seen: string[] = [];
    a.addEventListener('message', (e) => seen.push(`${e.data}`));

    nav(a, '/x');
    await settle();
    const b = await connect(room, bUid);
    nav(b, '/x');
    await settle();

    const counts = seen.map((s) => JSON.parse(s)).filter((m) => m.t === 'count');
    expect(counts.at(-1)).toEqual({ t: 'count', n: 2 });
  });

  it('keeps a visitor present when one of their tabs (same uid) closes', async () => {
    const room = 'multi-tab';
    const sharedUid = 'eeee1111ffff1111';
    const peerUid = 'dddd2222eeee2222';

    const tab1 = await connect(room, sharedUid);
    const tab2 = await connect(room, sharedUid);
    const peer = await connect(room, peerUid);
    nav(tab1, '/x');
    nav(tab2, '/x');
    nav(peer, '/x');
    await settle();

    const peerSeen: string[] = [];
    peer.addEventListener('message', (e) => peerSeen.push(`${e.data}`));

    tab1.close(); // one tab of the shared uid closes; tab2 is still open
    await settle();

    const parsed = peerSeen.map((s) => JSON.parse(s));
    expect(parsed.filter((m) => m.t === 'leave')).toHaveLength(0); // visitor still present via tab2
    expect(parsed.filter((m) => m.t === 'count').at(-1)).toEqual({ t: 'count', n: 2 }); // shared + peer
  });
});
