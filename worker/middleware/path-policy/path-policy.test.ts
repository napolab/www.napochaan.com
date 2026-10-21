import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

import { pathPolicy, resolvePathAction } from './index';
import { SAME_ORIGIN_FRAMING } from './plugins/admin-frame';

const crossSiteDocument = { 'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Dest': 'document' };

const request = (pathname: string, headers: HeadersInit = {}, method = 'GET') => ({ method, pathname, headers: new Headers(headers) });

describe('resolvePathAction', () => {
  it('prefers the landing redirect over the frame policy for a cross-site deep admin navigation', () => {
    expect(resolvePathAction(request('/admin/collections/blog/1', crossSiteDocument))._unsafeUnwrap()).toEqual({ kind: 'redirect', location: '/admin' });
  });

  it.each(['/admin', '/admin/', '/admin/collections/blog/1'])('frames %s when there is no cross-site document navigation', (pathname) => {
    expect(resolvePathAction(request(pathname))._unsafeUnwrap()).toEqual({ kind: 'frame', policy: SAME_ORIGIN_FRAMING });
  });

  it.each(['/admin', '/admin/'])('frames the admin root %s even for a cross-site document navigation', (pathname) => {
    expect(resolvePathAction(request(pathname, crossSiteDocument))._unsafeUnwrap()).toEqual({ kind: 'frame', policy: SAME_ORIGIN_FRAMING });
  });

  it.each(['/', '/administrator', '/oauth/authorize', '/next/preview'])('has no action for %s', (pathname) => {
    expect(resolvePathAction(request(pathname, crossSiteDocument)).isErr()).toBe(true);
  });
});

describe('pathPolicy', () => {
  const build = (upstream: () => Response = () => new Response('admin')) => {
    const handler = vi.fn(upstream);
    const app = new Hono().use('*', pathPolicy()).all('*', () => handler());

    return { app, handler };
  };

  describe('redirect', () => {
    it.each(['/admin/collections/blog/1?x=1', '/%61dmin/collections/blog/1', '/admin%2Fcollections', '/admin/%E0%A4%A'])(
      'sends a cross-site document GET of %s to /admin without caching or calling the handler',
      async (path) => {
        const { app, handler } = build();

        const res = await app.request(path, { headers: crossSiteDocument });

        expect(res.status).toBe(302);
        expect(res.headers.get('Location')).toBe('/admin');
        expect(res.headers.get('Cache-Control')).toBe('no-store');
        expect(handler).not.toHaveBeenCalled();
      },
    );

    it('redirects HEAD the same as GET', async () => {
      const { app, handler } = build();

      const res = await app.request('/admin/collections', { method: 'HEAD', headers: crossSiteDocument });

      expect(res.status).toBe(302);
      expect(handler).not.toHaveBeenCalled();
    });

    it('lets a same-origin deep admin navigation through', async () => {
      const { app, handler } = build();

      const res = await app.request('/admin/collections/blog/1', { headers: { 'Sec-Fetch-Site': 'same-origin', 'Sec-Fetch-Dest': 'document' } });

      expect(res.status).toBe(200);
      expect(handler).toHaveBeenCalledOnce();
    });

    it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('lets cross-site %s through', async (method) => {
      const { app, handler } = build();

      const res = await app.request('/admin/collections', { method, headers: crossSiteDocument });

      expect(res.status).toBe(200);
      expect(handler).toHaveBeenCalledOnce();
    });
  });

  describe('frame', () => {
    it.each(['/admin', '/admin/', '/admin/collections/blog/1', '/%61dmin'])('allows only same-origin framing of %s', async (path) => {
      const { app } = build();

      const res = await app.request(path);

      expect(res.headers.get('Content-Security-Policy')).toBe("frame-ancestors 'self'");
      expect(res.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
    });

    it('passes a cross-site navigation to the admin root through with frame headers', async () => {
      const { app, handler } = build();

      const res = await app.request('/admin', { headers: crossSiteDocument });

      expect(res.status).toBe(200);
      expect(await res.text()).toBe('admin');
      expect(handler).toHaveBeenCalledOnce();
      expect(res.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
    });

    it('appends frame-ancestors to an existing CSP without one', async () => {
      const { app } = build(() => new Response('x', { headers: { 'Content-Security-Policy': "default-src 'self'" } }));

      const res = await app.request('/admin');

      expect(res.headers.get('Content-Security-Policy')).toBe("default-src 'self'; frame-ancestors 'self'");
    });

    it('leaves an existing CSP that has frame-ancestors', async () => {
      const { app } = build(() => new Response('x', { headers: { 'Content-Security-Policy': "frame-ancestors 'none'" } }));

      const res = await app.request('/admin');

      expect(res.headers.get('Content-Security-Policy')).toBe("frame-ancestors 'none'");
    });

    it('still frames a malformed percent-encoded path whose raw pathname matches', async () => {
      const { app } = build();

      const res = await app.request('/admin/%E0%A4%A');

      expect(res.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
    });
  });

  describe('no match', () => {
    it.each(['/', '/administrator', '/oauth/authorize?x=1', '/x/%E0%A4%A'])('does not touch %s', async (path) => {
      const { app, handler } = build(() => new Response('x'));

      const res = await app.request(path, { headers: crossSiteDocument });

      expect(res.status).toBe(200);
      expect(handler).toHaveBeenCalledOnce();
      expect(res.headers.get('Content-Security-Policy')).toBeNull();
      expect(res.headers.get('X-Frame-Options')).toBeNull();
      expect(res.headers.get('Cache-Control')).toBeNull();
    });
  });
});
