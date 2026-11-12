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

  it('stamps a public policy on header-less feed responses from the mounted handler', async () => {
    const handlerFetch = vi.fn(async () => new Response('<rss/>'));
    const app = createWorkerApp(handlerFetch);
    const response = await app.request('/blog/rss.xml');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600, stale-while-revalidate=86400');
  });

  it('lets the cms admin frame a draft preview page served by the mounted handler', async () => {
    const handlerFetch = vi.fn(async () => new Response('preview'));
    const app = createWorkerApp(handlerFetch);
    const response = await app.request('/blog/preview/1', {}, { CMS_ORIGIN: 'https://cms-stg.napochaan.com' });
    expect(response.headers.get('Content-Security-Policy')).toBe("frame-ancestors 'self' https://cms-stg.napochaan.com");
    expect(response.headers.get('X-Frame-Options')).toBeNull();
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
