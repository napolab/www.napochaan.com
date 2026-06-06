import { describe, expect, it } from 'vitest';

import { hashIp } from '../../src/lib/cursor/identity';

import { cursorRoutes } from './cursors';

describe('cursorRoutes', () => {
  it('forwards a websocket upgrade to the DO at /rooms/<room>?uid=<hashed-ip>', async () => {
    const captured: { url?: string } = {};
    const env = {
      CURSOR_SALT: 'test-salt',
      CURSOR_ROOM: {
        idFromName: (name: string) => ({ name }),
        get: () => ({
          fetch: async (req: Request) => {
            captured.url = req.url;
            return new Response('forwarded', { status: 200, headers: { 'x-forwarded': '1' } });
          },
        }),
      },
    };

    const res = await cursorRoutes.request('/api/cursors/home', { headers: { Upgrade: 'websocket', 'cf-connecting-ip': '203.0.113.5' } }, env as unknown as Cloudflare.Env);

    expect(res.headers.get('x-forwarded')).toBe('1');
    const expectedUid = await hashIp('203.0.113.5', 'test-salt');
    expect(captured.url).toContain('/rooms/home');
    expect(captured.url).toContain(`uid=${expectedUid}`);
  });

  it('does not upgrade non-websocket requests', async () => {
    const env = { CURSOR_SALT: 'x', CURSOR_ROOM: { idFromName: () => ({}), get: () => ({ fetch: async () => new Response('x') }) } };
    const res = await cursorRoutes.request('/api/cursors/home', {}, env as unknown as Cloudflare.Env);
    // no Upgrade header → helper returns void → Hono yields a non-101 response
    expect(res.status).not.toBe(101);
  });
});
