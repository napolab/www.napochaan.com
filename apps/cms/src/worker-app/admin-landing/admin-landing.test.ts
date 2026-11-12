import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { adminLanding } from './index';

const crossSiteDocument = { 'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Dest': 'document' };

const build = () => new Hono().use('*', adminLanding()).all('*', () => new Response('next', { status: 200 }));

describe('adminLanding', () => {
  it.each(['/admin/collections/blog/1', '/admin/account', '/admin//x', '/admin/%E0%A4%A', '/%61dmin/collections', '/admin%2Fcollections'])(
    'redirects a cross-site document GET of %s to /admin',
    async (pathname) => {
      const res = await build().request(pathname, { headers: crossSiteDocument });
      expect(res.status).toBe(302);
      expect(res.headers.get('Location')).toBe('/admin');
      expect(res.headers.get('Cache-Control')).toBe('no-store');
    },
  );

  it('redirects HEAD the same as GET', async () => {
    const res = await build().request('/admin/collections', { method: 'HEAD', headers: crossSiteDocument });
    expect(res.status).toBe(302);
  });

  it.each(['/admin', '/admin/'])('lets the admin root %s through', async (pathname) => {
    expect((await build().request(pathname, { headers: crossSiteDocument })).status).toBe(200);
  });

  it.each(['/', '/administrator/x', '/adminx/y', '/api/users/me'])('ignores non-admin path %s', async (pathname) => {
    expect((await build().request(pathname, { headers: crossSiteDocument })).status).toBe(200);
  });

  it.each(['same-origin', 'same-site', 'none'])('lets a %s navigation through', async (site) => {
    const res = await build().request('/admin/collections', { headers: { 'Sec-Fetch-Site': site, 'Sec-Fetch-Dest': 'document' } });
    expect(res.status).toBe(200);
  });

  it('lets a request without fetch metadata through', async () => {
    expect((await build().request('/admin/collections')).status).toBe(200);
  });

  it.each(['iframe', 'image', 'empty'])('lets a cross-site %s request through', async (dest) => {
    const res = await build().request('/admin/collections', { headers: { 'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Dest': dest } });
    expect(res.status).toBe(200);
  });

  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('lets %s through', async (method) => {
    const res = await build().request('/admin/collections', { method, headers: crossSiteDocument });
    expect(res.status).toBe(200);
  });
});
