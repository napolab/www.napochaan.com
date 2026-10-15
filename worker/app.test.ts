import { describe, expect, it, vi } from 'vitest';

import { createWorkerApp } from './app';

describe('createWorkerApp', () => {
  it('blocks POST /api/mcp with 404 and never calls the mounted handler (guard beats mount)', async () => {
    const handlerFetch = vi.fn(async () => new Response('next', { status: 200 }));
    const app = createWorkerApp(handlerFetch);

    const response = await app.request('/api/mcp', { method: 'POST' });

    expect(response.status).toBe(404);
    expect(handlerFetch).not.toHaveBeenCalled();
  });

  it('blocks GET /api/mcp/x with 404 and never calls the mounted handler', async () => {
    const handlerFetch = vi.fn(async () => new Response('next', { status: 200 }));
    const app = createWorkerApp(handlerFetch);

    const response = await app.request('/api/mcp/x');

    expect(response.status).toBe(404);
    expect(handlerFetch).not.toHaveBeenCalled();
  });

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

  it('stamps a public policy on header-less feed responses from the mounted handler', async () => {
    const handlerFetch = vi.fn(async () => new Response('<rss/>'));
    const app = createWorkerApp(handlerFetch);
    const response = await app.request('/blog/rss.xml');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600, stale-while-revalidate=86400');
  });

  it('allows only same-origin framing of the admin served by the mounted handler', async () => {
    const handlerFetch = vi.fn(async () => new Response('admin'));
    const app = createWorkerApp(handlerFetch);
    const response = await app.request('/admin/collections/blog/1');
    expect(response.headers.get('Content-Security-Policy')).toBe("frame-ancestors 'self'");
    expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
  });

  it('sends a cross-site navigation into a deep admin page to /admin without calling the mounted handler', async () => {
    const handlerFetch = vi.fn(async () => new Response('admin'));
    const app = createWorkerApp(handlerFetch);
    const response = await app.request('/admin/collections/blog/1', { headers: { 'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Dest': 'document' } });
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/admin');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(handlerFetch).not.toHaveBeenCalled();
  });

  it('lets a cross-site navigation land on /admin', async () => {
    const handlerFetch = vi.fn(async () => new Response('admin'));
    const app = createWorkerApp(handlerFetch);
    const response = await app.request('/admin', { headers: { 'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Dest': 'document' } });
    expect(response.status).toBe(200);
    expect(handlerFetch).toHaveBeenCalledOnce();
  });

  it('keeps Next.js private policies untouched', async () => {
    const handlerFetch = vi.fn(async () => new Response('form', { headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' } }));
    const app = createWorkerApp(handlerFetch);
    const response = await app.request('/contact');
    expect(response.headers.get('Cache-Control')).toBe('private, no-cache, no-store, max-age=0, must-revalidate');
  });

  it('denies Workers Cache storage for header-less JSON 200s from the Payload REST API', async () => {
    const handlerFetch = vi.fn(async () => new Response('{"user":null}', { headers: { 'Content-Type': 'application/json' } }));
    const app = createWorkerApp(handlerFetch);
    const response = await app.request('/api/users/me');
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });
});
