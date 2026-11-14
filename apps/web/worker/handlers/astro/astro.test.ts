import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

import { getCMSClient } from '../../../src/lib/cms/client';
import { getRequestContext } from '../../../src/lib/request-context';

import { createAstroHandler } from './index';

import type { MountedFetch } from '../../app';
import type { CMSHealthVariables } from '../../lib/cms-health';

type Env = { Bindings: Cloudflare.Env; Variables: CMSHealthVariables };

// The mounted Astro handler's page code reads CMS through the request context (getCMSClient).
const cmsReadingHandler = (cmsResponse: () => Promise<Response>): MountedFetch =>
  vi.fn(async (_request: Request, ...args: unknown[]) => {
    try {
      await getRequestContext().env.CMS?.fetch('https://cms.internal/blog');
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
    .all('*', createAstroHandler(handler));

const cmsEnv = (respond: () => Promise<Response>) => ({ CMS: { fetch: vi.fn(respond), connect: vi.fn() } }) as unknown as Cloudflare.Env;

describe('createAstroHandler', () => {
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
    const handler: MountedFetch = async () => {
      const body = new ReadableStream<Uint8Array>({
        async start(controller) {
          controller.enqueue(new TextEncoder().encode('<shell>'));
          await getRequestContext()
            .env.CMS?.fetch('https://cms.internal/blog')
            .catch(() => undefined);
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

  it('marks degraded when CMS fails inside Astro render', async () => {
    const handler: MountedFetch = async () => {
      const res = await getCMSClient().blog.$get();
      return new Response(`<html>${res.status}</html>`, { headers: { 'Content-Type': 'text/html' } });
    };
    const app = build(handler);
    const res = await app.request(
      '/blog',
      {},
      cmsEnv(async () => new Response('boom', { status: 500 })),
    );
    expect(res.headers.get('X-Degraded')).toBe('1');
    expect(await res.text()).toBe('<html>500</html>');
  });

  it('hands the mounted fetch the wrapped env and the request context', async () => {
    const seen: { env?: Cloudflare.Env; context?: ReturnType<typeof getRequestContext> } = {};
    const handler: MountedFetch = async (_request, ...args) => {
      const [env] = args as [Cloudflare.Env];
      seen.env = env;
      seen.context = getRequestContext();
      return new Response('<html></html>', { headers: { 'Content-Type': 'text/html' } });
    };
    const env = cmsEnv(async () => new Response('ok'));
    const app = build(handler);
    await app.request('/blog', {}, env);
    expect(seen.context?.env).toBe(seen.env);
    expect(seen.env?.CMS).not.toBe(env.CMS);
    expect(seen.context?.request.url).toBe('http://localhost/blog');
  });

  it('does not leak the request context past the request', async () => {
    const app = build(async () => new Response('<html></html>', { headers: { 'Content-Type': 'text/html' } }));
    await app.request(
      '/blog',
      {},
      cmsEnv(async () => new Response('ok')),
    );
    expect(() => getRequestContext()).toThrow('request context is not available outside a request');
  });

  // A component that throws after the layout started streaming leaves Astro with a
  // half-written 200 body. Next never cached a failed render, so this must become the
  // 500 page and never carry a public policy.
  it('serves the 500 page with no-store when the page body errors mid-stream', async () => {
    const seen: string[] = [];
    const handler: MountedFetch = async (request: Request) => {
      const { pathname } = new URL(request.url);
      seen.push(pathname);
      if (pathname === '/500') return new Response('<html>500 page</html>', { status: 500, headers: { 'Content-Type': 'text/html' } });
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('<html><main>half'));
          controller.error(new Error('body boom'));
        },
      });
      return new Response(body, { headers: { 'Content-Type': 'text/html' } });
    };
    const app = build(handler);
    const res = await app.request(
      '/blog',
      {},
      cmsEnv(async () => new Response('ok')),
    );
    expect(res.status).toBe(500);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(await res.text()).toBe('<html>500 page</html>');
    expect(seen).toEqual(['/blog', '/500']);
  });

  it.each([404, 500])('marks a %i page no-store (never publicly cacheable)', async (status) => {
    const app = build(async () => new Response('<html>error</html>', { status, headers: { 'Content-Type': 'text/html' } }));
    const res = await app.request(
      '/nope',
      {},
      cmsEnv(async () => new Response('ok')),
    );
    expect(res.status).toBe(status);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  // Next sent `private, no-cache, no-store…` on its permanentRedirect (e.g. `/blog/page/1`).
  it('marks a 308 redirect no-store', async () => {
    const app = build(async () => new Response(null, { status: 308, headers: { Location: '/blog' } }));
    const res = await app.request(
      '/blog/page/1',
      {},
      cmsEnv(async () => new Response('ok')),
    );
    expect(res.status).toBe(308);
    expect(res.headers.get('Location')).toBe('/blog');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  // A 304 revalidates a cached copy: overwriting its Cache-Control would rewrite the
  // policy of the stored 200 it refreshes.
  it('leaves a 304 Not Modified untouched', async () => {
    const app = build(async () => new Response(null, { status: 304, headers: { 'Cache-Control': 'public, max-age=0, s-maxage=31536000' } }));
    const res = await app.request(
      '/blog',
      {},
      cmsEnv(async () => new Response('ok')),
    );
    expect(res.status).toBe(304);
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=0, s-maxage=31536000');
  });

  it('leaves a successful page for the cache-control middleware to stamp', async () => {
    const app = build(async () => new Response('<html>ok</html>', { headers: { 'Content-Type': 'text/html' } }));
    const res = await app.request(
      '/blog',
      {},
      cmsEnv(async () => new Response('ok')),
    );
    expect(res.headers.get('Cache-Control')).toBeNull();
  });

  // A form POST to a page (e.g. `/contact?_action=submitContact`) renders a 200 page
  // with the visitor's result in it: never shareable, whatever its path.
  it.each(['/contact', '/contact?_action=submitContact'])('marks a non-GET page response no-store (POST %s)', async (path) => {
    const app = build(async () => new Response('<html>result</html>', { headers: { 'Content-Type': 'text/html' } }));
    const res = await app.request(
      path,
      { method: 'POST' },
      cmsEnv(async () => new Response('ok')),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('leaves a HEAD page response for the cache-control middleware to stamp', async () => {
    const app = build(async () => new Response(null, { headers: { 'Content-Type': 'text/html' } }));
    const res = await app.request(
      '/contact',
      { method: 'HEAD' },
      cmsEnv(async () => new Response('ok')),
    );
    expect(res.headers.get('Cache-Control')).toBeNull();
  });

  // Next sent `text/html; charset=utf-8`; Astro's adapter sends a bare `text/html`.
  it.each(['/blog', '/news/missing'])('declares utf-8 on HTML responses (%s)', async (path) => {
    const app = build(async () => new Response('<html>ok</html>', { status: path === '/blog' ? 200 : 404, headers: { 'Content-Type': 'text/html' } }));
    const res = await app.request(
      path,
      {},
      cmsEnv(async () => new Response('ok')),
    );
    expect(res.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
  });

  it('leaves non-HTML and charset-bearing content types alone', async () => {
    const markdown = build(async () => new Response('# a', { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } }));
    const md = await markdown.request(
      '/about.md',
      {},
      cmsEnv(async () => new Response('ok')),
    );
    expect(md.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');

    const xml = build(async () => new Response('<rss/>', { headers: { 'Content-Type': 'application/xml' } }));
    const rss = await xml.request(
      '/news/rss.xml',
      {},
      cmsEnv(async () => new Response('ok')),
    );
    expect(rss.headers.get('Content-Type')).toBe('application/xml');
  });
});

describe('createAstroHandler markdown negotiation', () => {
  const MARKDOWN = { Accept: 'text/markdown' };
  const markdownHeaders = { 'Content-Type': 'text/markdown; charset=utf-8' };
  const htmlHeaders = { 'Content-Type': 'text/html' };

  type Route = (request: Request) => Response | Promise<Response>;

  // Records every path the mounted Astro fetch rendered.
  const routed = (route: Route) => {
    const seen: string[] = [];
    const handler: MountedFetch = async (request: Request) => {
      const url = new URL(request.url);
      seen.push(`${url.pathname}${url.search}`);
      return route(request);
    };
    return { seen, handler };
  };

  const okEnv = (extra: Record<string, unknown> = {}) => ({ ...cmsEnv(async () => new Response('ok')), ...extra }) as unknown as Cloudflare.Env;

  it('serves the `.md` twin at the page URL when markdown is preferred', async () => {
    const { seen, handler } = routed(() => new Response('# about', { headers: markdownHeaders }));
    const res = await build(handler).request('/about', { headers: MARKDOWN }, okEnv());
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
    expect(await res.text()).toBe('# about');
    expect(seen).toEqual(['/about.md']);
  });

  it('serves /llms.txt as markdown for the home page', async () => {
    const { seen, handler } = routed(() => new Response('# napochaan', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }));
    const res = await build(handler).request('/', { headers: MARKDOWN }, okEnv());
    expect(res.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
    expect(await res.text()).toBe('# napochaan');
    expect(seen).toEqual(['/llms.txt']);
  });

  it('maps a trailing-slash path and keeps the query string', async () => {
    const { seen, handler } = routed(() => new Response('# blog', { headers: markdownHeaders }));
    await build(handler).request('/blog/?x=1', { headers: MARKDOWN }, okEnv());
    expect(seen).toEqual(['/blog.md?x=1']);
  });

  it('renders the twin inside a request context holding the twin request', async () => {
    const urls: string[] = [];
    const handler: MountedFetch = async () => {
      urls.push(getRequestContext().request.url);
      return new Response('# about', { headers: markdownHeaders });
    };
    await build(handler).request('/about', { headers: MARKDOWN }, okEnv());
    expect(urls).toEqual(['http://localhost/about.md']);
  });

  it('renders HTML only when markdown is not preferred', async () => {
    const { seen, handler } = routed(() => new Response('<html></html>', { headers: htmlHeaders }));
    const res = await build(handler).request('/about', { headers: { Accept: 'text/html,*/*;q=0.8' } }, okEnv());
    expect(res.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
    expect(seen).toEqual(['/about']);
  });

  it('never negotiates a POST', async () => {
    const { seen, handler } = routed(() => new Response('<html></html>', { headers: htmlHeaders }));
    await build(handler).request('/contact', { method: 'POST', headers: MARKDOWN }, okEnv());
    expect(seen).toEqual(['/contact']);
  });

  it('never negotiates a path that already has an extension', async () => {
    const { seen, handler } = routed(() => new Response('<rss/>', { headers: { 'Content-Type': 'application/xml' } }));
    await build(handler).request('/blog/rss.xml', { headers: MARKDOWN }, okEnv());
    expect(seen).toEqual(['/blog/rss.xml']);
  });

  // gallery / contact / colophon / /blog/page/N have no `.md` twin.
  it('falls back to the HTML page when the twin is 404', async () => {
    const { seen, handler } = routed((request) =>
      new URL(request.url).pathname.endsWith('.md') ? new Response('<html>404</html>', { status: 404, headers: htmlHeaders }) : new Response('<html>gallery</html>', { headers: htmlHeaders }),
    );
    const res = await build(handler).request('/gallery', { headers: MARKDOWN }, okEnv());
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
    expect(await res.text()).toBe('<html>gallery</html>');
    expect(seen).toEqual(['/gallery.md', '/gallery']);
  });

  // e.g. a dynamic route that happens to accept `2.md` as a param renders HTML 200.
  it('falls back when the twin answers 200 with a non-markdown type', async () => {
    const { seen, handler } = routed(() => new Response('<html>page</html>', { headers: htmlHeaders }));
    const res = await build(handler).request('/blog/page/2', { headers: MARKDOWN }, okEnv());
    expect(await res.text()).toBe('<html>page</html>');
    expect(seen).toEqual(['/blog/page/2.md', '/blog/page/2']);
  });

  it('answers a markdown 404 (no-store) when the HTML page is missing too', async () => {
    const { seen, handler } = routed(() => new Response('<html>404</html>', { status: 404, headers: htmlHeaders }));
    const res = await build(handler).request('/nope', { headers: MARKDOWN }, okEnv({ BASE_URL: 'https://napochaan.com' }));
    expect(res.status).toBe(404);
    expect(res.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    const body = await res.text();
    expect(body).toContain('(https://napochaan.com/llms.txt)');
    expect(body).toContain('`/nope`');
    expect(seen).toEqual(['/nope.md', '/nope']);
  });

  it('builds markdown 404 links from the request origin when BASE_URL is unset', async () => {
    const { handler } = routed(() => new Response('<html>404</html>', { status: 404, headers: htmlHeaders }));
    const res = await build(handler).request('https://stg.example.com/nope', { headers: MARKDOWN }, okEnv());
    expect(await res.text()).toContain('(https://stg.example.com/sitemap.xml)');
  });

  it('passes a non-404 HTML fallback (e.g. a 308 redirect) through', async () => {
    const { handler } = routed((request) =>
      new URL(request.url).pathname.endsWith('.md') ? new Response(null, { status: 404 }) : new Response(null, { status: 308, headers: { Location: '/blog' } }),
    );
    const res = await build(handler).request('/blog/page/1', { headers: MARKDOWN }, okEnv());
    expect(res.status).toBe(308);
    expect(res.headers.get('Location')).toBe('/blog');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('serves a twin server error as is (no HTML fallback)', async () => {
    const { seen, handler } = routed(() => new Response('boom', { status: 500, headers: { 'Content-Type': 'text/plain' } }));
    const res = await build(handler).request('/about', { headers: MARKDOWN }, okEnv());
    expect(res.status).toBe(500);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(seen).toEqual(['/about.md']);
  });

  it('flags the request degraded when the twin render hits a CMS failure', async () => {
    const handler: MountedFetch = async () => {
      await getRequestContext()
        .env.CMS?.fetch('https://cms.internal/profile')
        .catch(() => undefined);
      return new Response('# about', { headers: markdownHeaders });
    };
    const res = await build(handler).request(
      '/about',
      { headers: MARKDOWN },
      cmsEnv(async () => new Response('boom', { status: 503 })),
    );
    expect(res.headers.get('X-Degraded')).toBe('1');
  });

  it('negotiates HEAD', async () => {
    const { seen, handler } = routed(() => new Response(null, { headers: markdownHeaders }));
    const res = await build(handler).request('/about', { method: 'HEAD', headers: MARKDOWN }, okEnv());
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
    expect(seen).toEqual(['/about.md']);
  });
});
