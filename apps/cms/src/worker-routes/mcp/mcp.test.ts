import { describe, expect, it, vi } from 'vitest';

import { createMCPRoutes } from './index';

type Captured = { request?: Request; body?: string };

const capturingFetch = (captured: Captured) =>
  vi.fn(async (request: Request) => {
    captured.request = request;
    captured.body = await request.text();
    return new Response('next', { status: 200 });
  });

describe('createMCPRoutes', () => {
  it('forwards POST /mcp to /api/mcp with the same method, headers and body', async () => {
    const captured: Captured = {};
    const handlerFetch = capturingFetch(captured);
    const routes = createMCPRoutes(handlerFetch);

    const response = await routes.request('/mcp', {
      method: 'POST',
      headers: { 'Cf-Access-Jwt-Assertion': 'x', 'Content-Type': 'application/json' },
      body: '{}',
    });

    expect(response.status).toBe(200);
    expect(handlerFetch).toHaveBeenCalledOnce();
    const url = new URL(captured.request?.url ?? 'http://invalid');
    expect(url.pathname).toBe('/api/mcp');
    expect(captured.request?.method).toBe('POST');
    expect(captured.request?.headers.get('Cf-Access-Jwt-Assertion')).toBe('x');
    expect(captured.request?.headers.get('Content-Type')).toBe('application/json');
    expect(captured.body).toBe('{}');
  });

  it('collapses /mcp/ to /api/mcp and keeps the query string', async () => {
    const captured: Captured = {};
    const handlerFetch = capturingFetch(captured);
    const routes = createMCPRoutes(handlerFetch);

    await routes.request('/mcp/?a=1');

    expect(handlerFetch).toHaveBeenCalledOnce();
    const url = new URL(captured.request?.url ?? 'http://invalid');
    expect(url.pathname).toBe('/api/mcp');
    expect(url.search).toBe('?a=1');
    expect(captured.request?.method).toBe('GET');
  });

  it('forwards nested paths under /mcp/ to /api/mcp', async () => {
    const captured: Captured = {};
    const handlerFetch = capturingFetch(captured);
    const routes = createMCPRoutes(handlerFetch);

    await routes.request('/mcp/anything', { method: 'DELETE' });

    expect(handlerFetch).toHaveBeenCalledOnce();
    expect(new URL(captured.request?.url ?? 'http://invalid').pathname).toBe('/api/mcp');
    expect(captured.request?.method).toBe('DELETE');
  });

  // Hono は percent-decode した path でルーティングするので /%6Dcp も forward される。一方
  // cache-control middleware は生の pathname(/%6Dcp)で判定して policy を付けないため、ここで既定を付ける。
  it('forwards a percent-encoded /%6Dcp and marks its response private, no-store', async () => {
    const captured: Captured = {};
    const handlerFetch = capturingFetch(captured);
    const routes = createMCPRoutes(handlerFetch);

    const response = await routes.request('/%6Dcp', { method: 'POST' });

    expect(handlerFetch).toHaveBeenCalledOnce();
    expect(new URL(captured.request?.url ?? 'http://invalid').pathname).toBe('/api/mcp');
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('keeps the upstream Cache-Control of the forwarded response', async () => {
    const handlerFetch = vi.fn(async () => new Response('next', { headers: { 'Cache-Control': 'no-cache' } }));
    const routes = createMCPRoutes(handlerFetch);

    const response = await routes.request('/mcp', { method: 'POST' });

    expect(response.headers.get('Cache-Control')).toBe('no-cache');
  });

  it('keeps the status and body of the forwarded response', async () => {
    const handlerFetch = vi.fn(async () => new Response('forbidden', { status: 403, statusText: 'Forbidden' }));
    const routes = createMCPRoutes(handlerFetch);

    const response = await routes.request('/mcp', { method: 'POST' });

    expect(response.status).toBe(403);
    expect(response.statusText).toBe('Forbidden');
    expect(await response.text()).toBe('forbidden');
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it.each(['/mcpfoo', '/api/mcp', '/x/mcp', '/'])('does not forward %s', async (path) => {
    const handlerFetch = vi.fn(async () => new Response('next'));
    const routes = createMCPRoutes(handlerFetch);

    const response = await routes.request(path, { method: 'POST' });

    expect(response.status).toBe(404); // Hono 未マッチのデフォルト 404
    expect(handlerFetch).not.toHaveBeenCalled();
  });

  it('passes env through to the mounted handler', async () => {
    const handlerFetch = vi.fn(async (_request: Request, ..._args: unknown[]) => new Response('next'));
    const routes = createMCPRoutes(handlerFetch);
    const env = { BASE_URL: 'https://example.test' } as unknown as Cloudflare.Env;

    await routes.request('/mcp', { method: 'POST' }, env);

    expect(handlerFetch.mock.calls[0]?.[1]).toBe(env);
  });
});
