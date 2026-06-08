import { describe, expect, it } from 'vitest';

import { hashIp } from '../../src/lib/cursor/identity';

import { cursorRoutes } from './cursors';

const fakeEnv = (captured: { url?: string }) => ({
  CURSOR_SALT: 'test-salt',
  CURSOR_ROOM: {
    idFromName: (name: string) => ({ name }),
    get: () => ({
      // hc calls the injected fetch as `fetch(urlString, init)`, so normalize to a Request.
      fetch: async (input: RequestInfo, init?: RequestInit) => {
        captured.url = new Request(input, init).url;
        const pair = new WebSocketPair();

        return new Response(null, { status: 101, webSocket: pair[1], headers: { 'x-room': 'ok' } });
      },
    }),
  },
});

describe('cursorRoutes', () => {
  it('forwards a websocket upgrade to the DO at the fixed global room with uid=<hashed-ip> and propagates the socket', async () => {
    const captured: { url?: string } = {};
    const env = fakeEnv(captured);

    const res = await cursorRoutes.request('/api/cursors', { headers: { Upgrade: 'websocket', 'cf-connecting-ip': '203.0.113.5' } }, env as unknown as Cloudflare.Env);

    const expectedUid = await hashIp('203.0.113.5', 'test-salt');
    expect(captured.url).toContain('/rooms/global');
    expect(captured.url).toContain(`uid=${expectedUid}`);
    expect(res.status).toBe(101);
    expect(res.webSocket).not.toBeNull();
    expect(res.headers.get('x-room')).toBe('ok');
  });

  it('does not upgrade non-websocket requests (durabcast upgrade() replies 426)', async () => {
    const captured: { url?: string } = {};
    const env = fakeEnv(captured);

    const res = await cursorRoutes.request('/api/cursors', {}, env as unknown as Cloudflare.Env);
    expect(res.status).not.toBe(101);
  });
});
