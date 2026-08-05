import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { toWeakETag, weakenETag } from './weaken-etag';

describe('toWeakETag', () => {
  it('prefixes a strong ETag with W/', () => {
    expect(toWeakETag('"b6b5r0x953913v"')).toBe('W/"b6b5r0x953913v"');
  });

  it('leaves an already-weak ETag unchanged', () => {
    expect(toWeakETag('W/"b6b5r0x953913v"')).toBe('W/"b6b5r0x953913v"');
  });
});

describe('weakenETag middleware', () => {
  const buildApp = (handler: () => Response) => {
    const app = new Hono();
    app.use('*', weakenETag());
    app.get('/', () => handler());
    return app;
  };

  it('rewrites a strong ETag to weak on the response', async () => {
    const app = buildApp(() => new Response('html', { headers: { ETag: '"abc123"' } }));

    const response = await app.request('/');

    expect(response.headers.get('ETag')).toBe('W/"abc123"');
    expect(await response.text()).toBe('html');
  });

  it('keeps an already-weak ETag as-is', async () => {
    const app = buildApp(() => new Response('html', { headers: { ETag: 'W/"abc123"' } }));

    const response = await app.request('/');

    expect(response.headers.get('ETag')).toBe('W/"abc123"');
  });

  it('returns the original response untouched when no ETag is present', async () => {
    // The identity path matters beyond performance: rebuilding a Response drops
    // non-standard properties (e.g. `webSocket` on upgrade responses from the
    // cursor routes), so ETag-less responses must pass through by reference.
    const original = new Response('no etag');
    const app = buildApp(() => original);

    const response = await app.request('/');

    expect(response).toBe(original);
    expect(response.headers.get('ETag')).toBeNull();
  });

  it('preserves status and other headers when rewriting', async () => {
    const app = buildApp(
      () =>
        new Response(null, {
          status: 304,
          headers: { ETag: '"abc123"', 'Cache-Control': 's-maxage=3600' },
        }),
    );

    const response = await app.request('/');

    expect(response.status).toBe(304);
    expect(response.headers.get('ETag')).toBe('W/"abc123"');
    expect(response.headers.get('Cache-Control')).toBe('s-maxage=3600');
  });
});
