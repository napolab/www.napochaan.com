import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

import { pathPolicy, resolvePathAction } from './index';

const CMS_ORIGIN = 'https://cms-stg.napochaan.com';
const PREVIEW_FRAMING = `frame-ancestors 'self' ${CMS_ORIGIN}`;

const request = (pathname: string) => ({ method: 'GET', pathname, headers: new Headers(), cmsOrigin: CMS_ORIGIN });

describe('resolvePathAction', () => {
  it.each(['/blog/preview/1', '/next/preview'])('frames %s for the cms admin', (pathname) => {
    expect(resolvePathAction(request(pathname))._unsafeUnwrap()).toEqual({ kind: 'frame', policy: { frameAncestors: PREVIEW_FRAMING } });
  });

  it.each(['/', '/admin', '/admin/collections/blog/1', '/oauth/authorize'])('has no action for %s', (pathname) => {
    expect(resolvePathAction(request(pathname)).isErr()).toBe(true);
  });
});

describe('pathPolicy', () => {
  const build = (upstream: () => Response = () => new Response('page')) => {
    const handler = vi.fn(upstream);
    const app = new Hono<{ Bindings: Cloudflare.Env }>().use('*', pathPolicy()).all('*', () => handler());

    return { app, handler };
  };
  const env = { CMS_ORIGIN } as unknown as Cloudflare.Env;

  describe('frame', () => {
    it.each(['/blog/preview/1', '/news/preview/1', '/works/preview/1', '/gallery/preview', '/log/preview', '/next/preview', '/%62log/preview/1'])('allows the cms admin to frame %s', async (path) => {
      const { app } = build();

      const res = await app.request(path, {}, env);

      expect(res.headers.get('Content-Security-Policy')).toBe(PREVIEW_FRAMING);
    });

    it('drops an upstream X-Frame-Options that would block the cross-origin cms frame', async () => {
      const { app } = build(() => new Response('x', { headers: { 'X-Frame-Options': 'SAMEORIGIN' } }));

      const res = await app.request('/blog/preview/1', {}, env);

      expect(res.headers.get('X-Frame-Options')).toBeNull();
    });

    it('frames same-origin only when CMS_ORIGIN is not configured', async () => {
      const { app } = build();

      const res = await app.request('/blog/preview/1');

      expect(res.headers.get('Content-Security-Policy')).toBe("frame-ancestors 'self'");
    });

    it('appends frame-ancestors to an existing CSP without one', async () => {
      const { app } = build(() => new Response('x', { headers: { 'Content-Security-Policy': "default-src 'self'" } }));

      const res = await app.request('/blog/preview/1', {}, env);

      expect(res.headers.get('Content-Security-Policy')).toBe(`default-src 'self'; ${PREVIEW_FRAMING}`);
    });

    it('leaves an existing CSP that has frame-ancestors', async () => {
      const { app } = build(() => new Response('x', { headers: { 'Content-Security-Policy': "frame-ancestors 'none'" } }));

      const res = await app.request('/blog/preview/1', {}, env);

      expect(res.headers.get('Content-Security-Policy')).toBe("frame-ancestors 'none'");
    });
  });

  describe('no match', () => {
    it.each(['/', '/admin/collections/blog/1', '/blog/a', '/x/%E0%A4%A'])('does not touch %s', async (path) => {
      const { app, handler } = build(() => new Response('x'));

      const res = await app.request(path, {}, env);

      expect(res.status).toBe(200);
      expect(handler).toHaveBeenCalledOnce();
      expect(res.headers.get('Content-Security-Policy')).toBeNull();
      expect(res.headers.get('X-Frame-Options')).toBeNull();
      expect(res.headers.get('Cache-Control')).toBeNull();
    });
  });
});
