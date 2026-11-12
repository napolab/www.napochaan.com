import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

import { createNextHandler } from './index';

import type { MountedFetch } from '../../app';
import type { CMSHealthVariables } from '../../lib/cms-health';

type Env = { Bindings: Cloudflare.Env; Variables: CMSHealthVariables };

// The mounted OpenNext handler reads CMS through `env.CMS` (getCloudflareContext).
const cmsReadingHandler = (cmsResponse: () => Promise<Response>): MountedFetch =>
  vi.fn(async (_request: Request, ...args: unknown[]) => {
    const [env] = args as [Cloudflare.Env];
    try {
      await env.CMS?.fetch('https://cms.internal/blog');
    } catch {
      // the page's error boundary renders a fallback; the status stays 200
    }
    return new Response('<html>page</html>', { headers: { 'Content-Type': 'text/html' } });
  });

const build = (handler: MountedFetch) =>
  new Hono<Env>()
    .use('*', async (c, next) => {
      await next();
      c.header('X-Degraded', c.get('cmsDegraded') === true ? '1' : '0');
    })
    .all('*', createNextHandler(handler));

const cmsEnv = (respond: () => Promise<Response>) => ({ CMS: { fetch: vi.fn(respond), connect: vi.fn() } }) as unknown as Cloudflare.Env;

describe('createNextHandler', () => {
  it('flags the request when a CMS read throws during render', async () => {
    const app = build(cmsReadingHandler(async () => new Response('ok')));
    const res = await app.request(
      '/blog',
      {},
      cmsEnv(async () => {
        throw new Error('down');
      }),
    );
    expect(res.headers.get('X-Degraded')).toBe('1');
    expect(await res.text()).toBe('<html>page</html>');
  });

  it('flags the request on a CMS 5xx', async () => {
    const app = build(cmsReadingHandler(async () => new Response('ok')));
    const res = await app.request(
      '/blog',
      {},
      cmsEnv(async () => new Response('boom', { status: 503 })),
    );
    expect(res.headers.get('X-Degraded')).toBe('1');
  });

  it('does not flag a CMS 404', async () => {
    const app = build(cmsReadingHandler(async () => new Response('ok')));
    const res = await app.request(
      '/blog/missing',
      {},
      cmsEnv(async () => new Response(null, { status: 404 })),
    );
    expect(res.headers.get('X-Degraded')).toBe('0');
  });

  // Streaming SSR resolves Suspense'd CMS reads after the handler returns, so the body
  // must be read to the end before the degraded flag is final.
  it('catches a CMS failure that happens while the body streams', async () => {
    const handler: MountedFetch = async (_request, ...args) => {
      const [env] = args as [Cloudflare.Env];
      const body = new ReadableStream<Uint8Array>({
        async start(controller) {
          controller.enqueue(new TextEncoder().encode('<shell>'));
          await env.CMS?.fetch('https://cms.internal/blog').catch(() => undefined);
          controller.enqueue(new TextEncoder().encode('</shell>'));
          controller.close();
        },
      });
      return new Response(body, { headers: { 'Content-Type': 'text/html' } });
    };
    const app = build(handler);
    const res = await app.request(
      '/blog',
      {},
      cmsEnv(async () => {
        throw new Error('down');
      }),
    );
    expect(res.headers.get('X-Degraded')).toBe('1');
    expect(await res.text()).toBe('<shell></shell>');
  });

  it('passes non-page responses through without reading them', async () => {
    const app = build(async () => new Response('img', { headers: { 'Content-Type': 'image/png' } }));
    const res = await app.request(
      '/api/media/file/a.png',
      {},
      cmsEnv(async () => new Response('ok')),
    );
    expect(await res.text()).toBe('img');
    expect(res.headers.get('X-Degraded')).toBe('0');
  });
});
