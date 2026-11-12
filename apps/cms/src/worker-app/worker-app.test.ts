import { describe, expect, it, vi } from 'vitest';

import { createWorkerApp } from './index';

describe('createWorkerApp', () => {
  it('redirects a cross-site deep admin navigation before the mount (landing beats mount)', async () => {
    const handlerFetch = vi.fn(async () => new Response('next', { status: 200 }));
    const app = createWorkerApp(handlerFetch);

    const response = await app.request('/admin/collections/blog/1', { headers: { 'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Dest': 'document' } });

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/admin');
    expect(handlerFetch).not.toHaveBeenCalled();
  });

  it('passes a same-origin deep admin navigation to the mount', async () => {
    const handlerFetch = vi.fn(async () => new Response('next', { status: 200 }));
    const app = createWorkerApp(handlerFetch);

    const response = await app.request('/admin/collections/blog/1', { headers: { 'Sec-Fetch-Site': 'same-origin', 'Sec-Fetch-Dest': 'document' } });

    expect(response.status).toBe(200);
    expect(handlerFetch).toHaveBeenCalledOnce();
  });

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

  it('forwards POST /mcp to the mounted handler as /api/mcp (the mcp route beats the guard)', async () => {
    const captured: { request?: Request; body?: string } = {};
    const handlerFetch = vi.fn(async (request: Request) => {
      captured.request = request;
      captured.body = await request.text();
      return new Response('mcp', { status: 200 });
    });
    const app = createWorkerApp(handlerFetch);

    const response = await app.request('/mcp', { method: 'POST', headers: { 'Cf-Access-Jwt-Assertion': 'x' }, body: '{}' });

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('mcp');
    expect(handlerFetch).toHaveBeenCalledOnce();
    expect(new URL(captured.request?.url ?? 'http://invalid').pathname).toBe('/api/mcp');
    expect(captured.request?.headers.get('Cf-Access-Jwt-Assertion')).toBe('x');
    expect(captured.body).toBe('{}');
  });

  it('marks header-less 200s from /mcp as private, no-store', async () => {
    const handlerFetch = vi.fn(async () => new Response('{}', { headers: { 'Content-Type': 'application/json' } }));
    const app = createWorkerApp(handlerFetch);
    const response = await app.request('/mcp', { method: 'POST', body: '{}' });
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('serves the MCP protected resource metadata before the mount when MCP Access is configured', async () => {
    const handlerFetch = vi.fn(async () => new Response('next', { status: 404 }));
    const app = createWorkerApp(handlerFetch);

    const response = await app.request('https://cms-stg.napochaan.com/.well-known/oauth-protected-resource/mcp', {}, { CF_ACCESS_TEAM_DOMAIN: 'napochaan', CF_ACCESS_MCP_AUD: 'aud-1' });

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=300');
    expect(await response.json()).toEqual({ resource: 'https://cms-stg.napochaan.com/mcp', authorization_servers: ['https://napochaan.cloudflareaccess.com'] });
    expect(handlerFetch).not.toHaveBeenCalled();
  });

  it.each(['/.well-known/oauth-protected-resource/mcp', '/.well-known/oauth-authorization-server'])('falls through %s to the mounted handler when MCP Access is not configured', async (path) => {
    const handlerFetch = vi.fn(async () => new Response('next', { status: 404 }));
    const app = createWorkerApp(handlerFetch);

    const response = await app.request(path, {}, { CF_ACCESS_TEAM_DOMAIN: 'napochaan' });

    expect(response.status).toBe(404);
    expect(await response.text()).toBe('next');
    expect(handlerFetch).toHaveBeenCalledOnce();
  });

  it.each(['/admin', '/api/users/me', '/api/media-upload'])('falls through %s to the mounted handler', async (path) => {
    const handlerFetch = vi.fn(async () => new Response('next', { status: 200 }));
    const app = createWorkerApp(handlerFetch);

    const response = await app.request(path, { method: 'POST' });

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('next');
    expect(handlerFetch).toHaveBeenCalledOnce();
  });
});
