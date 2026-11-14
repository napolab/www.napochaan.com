import { runWithRequestContext } from '../../../src/lib/request-context';
import { PAGE_CACHE_POLICIES } from '../../../src/utils/cache-control';
import { createCMSHealth, withTrackedCMS } from '../../lib/cms-health';
import { acceptsMarkdown } from '../../lib/markdown-negotiation/accepts-markdown';
import { isNegotiablePath } from '../../lib/markdown-negotiation/negotiable-path';
import { resolveCacheControl } from '../../middleware/cache-control';
import { renderMarkdownPreferred } from './negotiate';

import type { MountedFetch } from '../../app';
import type { CMSHealthVariables } from '../../lib/cms-health';
import type { Render } from './negotiate';
import type { Context } from 'hono';

type AstroEnv = { Bindings: Cloudflare.Env; Variables: CMSHealthVariables };

// `app.request()` without an execution context (tests) throws on access. Hono types it
// with its own narrower ExecutionContext; on Workers it is the runtime's.
const readExecutionCtx = (c: Context<AstroEnv>): ExecutionContext | undefined => {
  try {
    return c.executionCtx as ExecutionContext;
  } catch {
    return undefined;
  }
};

const isCacheablePage = (request: Request, response: Response): boolean => {
  if (response.status !== 200 || response.body === null) return false;
  if (request.method !== 'GET' && request.method !== 'HEAD') return false;

  return resolveCacheControl(new URL(request.url).pathname).kind === 'page';
};

type RenderTarget = { astroFetch: MountedFetch; request: Request; env: Cloudflare.Env; ctx: ExecutionContext | undefined };

// A component that throws after Astro started streaming errors the body mid-way: the
// status is already 200 and the HTML is cut off. Serve the 500 route instead (Astro
// renders `src/pages/500.astro` there with status 500). Next never cached a failed
// render; the status-based no-store below keeps that true here.
const renderServerError = async ({ astroFetch, request, env, ctx }: RenderTarget): Promise<Response> => {
  const errorPage = await astroFetch(new Request(new URL('/500', request.url), { headers: request.headers }), env, ctx);

  return new Response(await errorPage.text(), { status: 500, statusText: 'Internal Server Error', headers: errorPage.headers });
};

// Astro streams the page body, so CMS reads in nested components resolve after the
// adapter returns the Response. A cacheable page is read to the end before the
// degraded flag is final. Only Workers Cache misses pay this (a HIT never runs the Worker).
const settle = async (target: RenderTarget, response: Response): Promise<Response> => {
  if (!isCacheablePage(target.request, response)) return response;

  try {
    return new Response(await response.arrayBuffer(), response);
  } catch {
    return renderServerError(target);
  }
};

// Redirects (e.g. the `/blog/page/1` → `/blog` 308) and 404 / 500 (any non-2xx status)
// must never be shared: the cache-control middleware only stamps OK responses, and Next
// sent `no-store` for these too (`private, no-cache, no-store…` on permanentRedirect).
// A 304 Not Modified is a revalidation of a stored 200, not a page of its own: its
// headers refresh the cached copy, so it keeps whatever policy it carries.
const isNotModified = (response: Response): boolean => response.status === 304;

const withErrorPolicy = (response: Response): Response => {
  if (response.status < 300 || isNotModified(response)) return response;
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', PAGE_CACHE_POLICIES.uncacheable);

  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};

// A non-GET/HEAD response (a form-mode Astro Action POST to a page renders that
// visitor's result as a 200 page) is never shareable. The cache-control middleware only
// stamps GET/HEAD page responses, so without this it would carry no Cache-Control at all.
const isReadRequest = (request: Request): boolean => request.method === 'GET' || request.method === 'HEAD';

const withWritePolicy = (request: Request, response: Response): Response => {
  if (isReadRequest(request)) return response;
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', PAGE_CACHE_POLICIES.uncacheable);

  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};

// Next sent `text/html; charset=utf-8`; the Astro adapter sends a bare `text/html`.
// Declare the charset on every HTML response (pages, 404, 500) so the bytes are never
// sniffed. Other types (markdown, RSS, JSON) set their own and pass through.
const withHTMLCharset = (response: Response): Response => {
  if (response.headers.get('Content-Type') !== 'text/html') return response;
  const headers = new Headers(response.headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');

  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};

// One render of `request` by the mounted Astro fetch, inside a request context holding
// the wrapped env and that request (a negotiated render sees the twin URL). Settling
// stays inside the scope so streamed reads see it too.
const createRender =
  (astroFetch: MountedFetch, env: Cloudflare.Env, ctx: ExecutionContext | undefined): Render =>
  async (request) =>
    runWithRequestContext({ env, ctx, request }, async () => settle({ astroFetch, request, env, ctx }, await astroFetch(request, env, ctx)));

const prefersMarkdown = (request: Request): boolean => isNegotiablePath({ method: request.method, pathname: new URL(request.url).pathname }) && acceptsMarkdown(request.headers.get('Accept'));

// Same convention as the `.md` endpoints (BASE_URL); `app.request()` without env (tests)
// falls back to the request origin.
const baseURLFor = (env: Cloudflare.Env | undefined, request: Request): string => env?.BASE_URL ?? new URL(request.url).origin;

// Content negotiation happens here, never in page code (a cacheable page must not read
// request headers). The `varyAccept` middleware keys the stored variants on Accept.
const respond = (request: Request, render: Render, env: Cloudflare.Env | undefined): Promise<Response> => {
  if (!prefersMarkdown(request)) return render(request);

  return renderMarkdownPreferred({ request, render, baseURL: baseURLFor(env, request) });
};

// The mounted Astro fetch (`@astrojs/cloudflare/handler`), with this request's `CMS`
// binding wrapped. The adapter never hands page code the env passed here (pages would
// otherwise read the raw global `cloudflare:workers` env), so every render runs inside
// an AsyncLocalStorage request context holding the wrapped env, and `getCMSClient()`
// reads that store. One health tracker covers every render of the request.
export const createAstroHandler = (astroFetch: MountedFetch) => async (c: Context<AstroEnv>) => {
  const health = createCMSHealth();
  const env = withTrackedCMS(c.env, health);
  const render = createRender(astroFetch, env, readExecutionCtx(c));
  const response = await respond(c.req.raw, render, env);
  if (health.isDegraded()) c.set('cmsDegraded', true);

  return withHTMLCharset(withWritePolicy(c.req.raw, withErrorPolicy(response)));
};
