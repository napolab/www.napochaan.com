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
});
