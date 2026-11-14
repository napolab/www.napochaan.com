import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { varyAccept } from './vary-accept';

const build = (respond: () => Response) => new Hono().use('*', varyAccept()).all('*', () => respond());

describe('varyAccept', () => {
  it('adds Vary: Accept to a negotiable page response', async () => {
    const res = await build(() => new Response('<html></html>')).request('/about');
    expect(res.headers.get('Vary')).toBe('Accept');
  });

  it('appends to an upstream Vary instead of replacing it', async () => {
    const res = await build(() => new Response('<html></html>', { headers: { Vary: 'Accept-Encoding' } })).request('/about');
    expect(res.headers.get('Vary')).toBe('Accept-Encoding, Accept');
  });

  it.each([404, 308, 500])('varies a %i too (a stored error must not answer the other representation)', async (status) => {
    const res = await build(() => new Response(null, { status })).request('/about');
    expect(res.headers.get('Vary')).toBe('Accept');
  });

  it.each(['/about.md', '/llms.txt', '/api/media/file/a.png', '/blog/preview/1'])('leaves non-negotiable %s untouched by reference', async (path) => {
    const original = new Response('x');
    const res = await build(() => original).request(path);
    expect(res.headers.get('Vary')).toBeNull();
  });

  it('leaves non-GET/HEAD responses alone', async () => {
    const res = await build(() => new Response('ok')).request('/contact', { method: 'POST' });
    expect(res.headers.get('Vary')).toBeNull();
  });
});
