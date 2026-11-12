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

  it('keeps the Next.js private policy on a Server Action POST', async () => {
    const handlerFetch = vi.fn(async () => new Response('form', { headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' } }));
    const app = createWorkerApp(handlerFetch);
    const response = await app.request('/contact', { method: 'POST' });
    expect(response.headers.get('Cache-Control')).toBe('private, no-cache, no-store, max-age=0, must-revalidate');
  });
});
