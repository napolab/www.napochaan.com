import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

import { adminCrossSiteLanding, isCrossSiteDeepAdminNavigation } from './admin-landing';

const crossSiteDocument = { 'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Dest': 'document' };

describe('isCrossSiteDeepAdminNavigation', () => {
  it.each(['/admin/collections/blog/1', '/admin/account', '/admin//x', '/%61dmin/collections/blog/1', '/admin%2Fcollections', '/admin/%E0%A4%A'])(
    'redirects a cross-site document GET of %s',
    (pathname) => {
      expect(isCrossSiteDeepAdminNavigation({ method: 'GET', pathname, headers: new Headers(crossSiteDocument) })).toBe(true);
    },
  );

  it('redirects HEAD the same as GET', () => {
    expect(isCrossSiteDeepAdminNavigation({ method: 'HEAD', pathname: '/admin/collections', headers: new Headers(crossSiteDocument) })).toBe(true);
  });

  // Access ログイン直後の着地先。ここまで弾くと IdP 経由のログインが成立しない。
  it.each(['/admin', '/admin/', '/%61dmin'])('lets the admin root %s through', (pathname) => {
    expect(isCrossSiteDeepAdminNavigation({ method: 'GET', pathname, headers: new Headers(crossSiteDocument) })).toBe(false);
  });

  it.each(['/', '/administrator/x', '/adminx/y', '/api/users/me', '/oauth/authorize'])('ignores non-admin path %s', (pathname) => {
    expect(isCrossSiteDeepAdminNavigation({ method: 'GET', pathname, headers: new Headers(crossSiteDocument) })).toBe(false);
  });

  it.each(['same-origin', 'same-site', 'none'])('lets a %s navigation through', (site) => {
    const headers = new Headers({ 'Sec-Fetch-Site': site, 'Sec-Fetch-Dest': 'document' });

    expect(isCrossSiteDeepAdminNavigation({ method: 'GET', pathname: '/admin/collections', headers })).toBe(false);
  });

  it('lets a request without fetch metadata through', () => {
    expect(isCrossSiteDeepAdminNavigation({ method: 'GET', pathname: '/admin/collections', headers: new Headers() })).toBe(false);
  });

  // 非 document の cross-site は Payload の strategy(csrf)が user を解決しないので、ここでは触らない。
  it.each(['iframe', 'image', 'empty'])('lets a cross-site %s request through', (dest) => {
    const headers = new Headers({ 'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Dest': dest });

    expect(isCrossSiteDeepAdminNavigation({ method: 'GET', pathname: '/admin/collections', headers })).toBe(false);
  });

  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('lets %s through', (method) => {
    expect(isCrossSiteDeepAdminNavigation({ method, pathname: '/admin/collections', headers: new Headers(crossSiteDocument) })).toBe(false);
  });
});

describe('adminCrossSiteLanding', () => {
  const build = () => {
    const upstream = vi.fn(() => new Response('admin'));
    const app = new Hono().use('*', adminCrossSiteLanding()).all('*', () => upstream());

    return { app, upstream };
  };

  it('redirects a cross-site deep admin navigation to /admin without caching it', async () => {
    const { app, upstream } = build();

    const res = await app.request('/admin/collections/blog/1?x=1', { headers: crossSiteDocument });

    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('/admin');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(upstream).not.toHaveBeenCalled();
  });

  it('passes the admin root through', async () => {
    const { app, upstream } = build();

    const res = await app.request('/admin', { headers: crossSiteDocument });

    expect(res.status).toBe(200);
    expect(await res.text()).toBe('admin');
    expect(upstream).toHaveBeenCalledOnce();
  });

  it('passes a same-origin deep admin navigation through', async () => {
    const { app, upstream } = build();

    const res = await app.request('/admin/collections/blog/1', { headers: { 'Sec-Fetch-Site': 'same-origin', 'Sec-Fetch-Dest': 'document' } });

    expect(res.status).toBe(200);
    expect(upstream).toHaveBeenCalledOnce();
  });
});
