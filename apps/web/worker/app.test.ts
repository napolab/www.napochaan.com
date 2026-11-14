import { describe, expect, it, vi } from 'vitest';

import { createWorkerApp } from './app';

describe('createWorkerApp', () => {
  it('falls through unrelated paths to the mounted handler', async () => {
    const handlerFetch = vi.fn(async () => new Response('next', { status: 200 }));
    const app = createWorkerApp(handlerFetch);

    const response = await app.request('/some-page');

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('next');
    expect(handlerFetch).toHaveBeenCalledOnce();
  });

  it('weakens a strong ETag on mounted handler responses so the edge can compress', async () => {
    const handlerFetch = vi.fn(async () => new Response('html', { headers: { ETag: '"abc123"' } }));
    const app = createWorkerApp(handlerFetch);

    const response = await app.request('/some-page');

    expect(response.headers.get('ETag')).toBe('W/"abc123"');
    expect(await response.text()).toBe('html');
  });

  it('stamps the purge-driven cms policy on header-less feed responses from the mounted handler', async () => {
    const handlerFetch = vi.fn(async () => new Response('<rss/>'));
    const app = createWorkerApp(handlerFetch);
    const response = await app.request('/blog/rss.xml');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=0, s-maxage=31536000');
  });

  it('replaces the force-dynamic private policy so Workers Cache stores CMS pages', async () => {
    const handlerFetch = vi.fn(async () => new Response('html', { headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' } }));
    const app = createWorkerApp(handlerFetch);
    const response = await app.request('/blog/a');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=0, s-maxage=31536000');
  });

  it('forces no-store when a CMS read failed during the render', async () => {
    const handlerFetch = vi.fn(async (_request: Request, ...args: unknown[]) => {
      const [env] = args as [Cloudflare.Env];
      await env.CMS?.fetch('https://cms.internal/blog').catch(() => undefined);
      return new Response('html', { headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' } });
    });
    const app = createWorkerApp(handlerFetch);
    const env = { CMS: { fetch: vi.fn(async () => new Response('boom', { status: 500 })), connect: vi.fn() } } as unknown as Cloudflare.Env;
    const response = await app.request('/blog/a', {}, env);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('keeps the cms policy when the CMS answered normally', async () => {
    const handlerFetch = vi.fn(async (_request: Request, ...args: unknown[]) => {
      const [env] = args as [Cloudflare.Env];
      await env.CMS?.fetch('https://cms.internal/blog/missing');
      return new Response('html');
    });
    const app = createWorkerApp(handlerFetch);
    const env = { CMS: { fetch: vi.fn(async () => new Response(null, { status: 404 })), connect: vi.fn() } } as unknown as Cloudflare.Env;
    const response = await app.request('/blog/a', {}, env);
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=0, s-maxage=31536000');
  });

  it('never lets a draft preview page into Workers Cache', async () => {
    const handlerFetch = vi.fn(async () => new Response('draft'));
    const app = createWorkerApp(handlerFetch);
    const response = await app.request('/blog/preview/1');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('lets the cms admin frame a draft preview page served by the mounted handler', async () => {
    const handlerFetch = vi.fn(async () => new Response('preview'));
    const app = createWorkerApp(handlerFetch);
    const response = await app.request('/blog/preview/1', {}, { CMS_ORIGIN: 'https://cms-stg.napochaan.com' });
    expect(response.headers.get('Content-Security-Policy')).toBe("frame-ancestors 'self' https://cms-stg.napochaan.com");
    expect(response.headers.get('X-Frame-Options')).toBeNull();
  });

  // A form POST to a page (Astro Action form mode) carries no Cache-Control from Astro;
  // the Astro handler marks every non-GET/HEAD response no-store.
  it.each<Record<string, string>>([{}, { 'Cache-Control': 'public, max-age=60' }])('marks a page POST no-store (upstream headers %o)', async (headers) => {
    const handlerFetch = vi.fn(async () => new Response('form', { headers }));
    const app = createWorkerApp(handlerFetch);
    const response = await app.request('/contact', { method: 'POST' });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
});

describe('createWorkerApp markdown negotiation', () => {
  const MARKDOWN = { Accept: 'text/markdown' };

  // The bug the "Agent Ready" article hit: a framework layer overwrote Vary, so a cached
  // HTML entry answered markdown requests. Assert on the final response of the full chain.
  it('keeps Vary: Accept alongside the upstream Vary through every middleware', async () => {
    const handlerFetch = vi.fn(
      async () =>
        new Response('html', {
          headers: { ETag: '"abc"', Vary: 'Accept-Encoding', 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate', 'Content-Type': 'text/html' },
        }),
    );
    const response = await createWorkerApp(handlerFetch).request('/about');
    expect(response.headers.get('Vary')).toBe('Accept-Encoding, Accept');
    expect(response.headers.get('ETag')).toBe('W/"abc"');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=0, s-maxage=31536000');
  });

  it.each([
    ['/about', 200],
    ['/missing', 404],
    ['/blog/page/1', 308],
  ])('varies %s (%i) on Accept even without a markdown request', async (path, status) => {
    const handlerFetch = vi.fn(async () => new Response(status === 308 ? null : 'html', { status, headers: { 'Content-Type': 'text/html' } }));
    const response = await createWorkerApp(handlerFetch).request(path);
    expect(response.headers.get('Vary')).toBe('Accept');
  });

  it.each(['/about.md', '/api/media/file/a.png', '/blog/preview/1'])('does not vary %s', async (path) => {
    const handlerFetch = vi.fn(async () => new Response('x'));
    const response = await createWorkerApp(handlerFetch).request(path);
    expect(response.headers.get('Vary')).toBeNull();
  });

  it('answers / with llms.txt as markdown under the time-sensitive policy', async () => {
    const handlerFetch = vi.fn(async (request: Request) => {
      if (new URL(request.url).pathname !== '/llms.txt') return new Response('html', { headers: { 'Content-Type': 'text/html' } });
      return new Response('# napochaan', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    });
    const response = await createWorkerApp(handlerFetch).request('/', { headers: MARKDOWN });
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=0, s-maxage=3600');
    expect(response.headers.get('Vary')).toBe('Accept');
    expect(await response.text()).toBe('# napochaan');
  });

  it('serves the markdown twin with the cms policy and Vary', async () => {
    const handlerFetch = vi.fn(async () => new Response('# about', { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } }));
    const response = await createWorkerApp(handlerFetch).request('/about', { headers: MARKDOWN });
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=0, s-maxage=31536000');
    expect(response.headers.get('Vary')).toBe('Accept');
  });

  it('forces no-store on a twin rendered against a failing CMS', async () => {
    const handlerFetch = vi.fn(async (_request: Request, ...args: unknown[]) => {
      const [env] = args as [Cloudflare.Env];
      await env.CMS?.fetch('https://cms.internal/profile').catch(() => undefined);
      return new Response('# about', { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
    });
    const env = { CMS: { fetch: vi.fn(async () => new Response('boom', { status: 500 })), connect: vi.fn() } } as unknown as Cloudflare.Env;
    const response = await createWorkerApp(handlerFetch).request('/about', { headers: MARKDOWN }, env);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Vary')).toBe('Accept');
  });

  it('answers a missing page with a markdown 404 that varies on Accept', async () => {
    const handlerFetch = vi.fn(async () => new Response('<html>404</html>', { status: 404, headers: { 'Content-Type': 'text/html' } }));
    const response = await createWorkerApp(handlerFetch).request('/nope', { headers: MARKDOWN }, { BASE_URL: 'https://napochaan.com' });
    expect(response.status).toBe(404);
    expect(response.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Vary')).toBe('Accept');
  });

  it('negotiates HEAD through the full chain', async () => {
    const handlerFetch = vi.fn(async () => new Response(null, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } }));
    const response = await createWorkerApp(handlerFetch).request('/about', { method: 'HEAD', headers: MARKDOWN });
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
    expect(response.headers.get('Vary')).toBe('Accept');
  });
});
