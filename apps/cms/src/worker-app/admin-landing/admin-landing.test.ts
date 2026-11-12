import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { adminLanding } from './index';

const crossSiteDocument = { 'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Dest': 'document' };

const build = () => new Hono().use('*', adminLanding()).all('*', () => new Response('next', { status: 200 }));

describe('adminLanding', () => {
  it.each([
    '/collections/blog',
    '/collections/blog/1',
    '/collections/blog/create',
    '/account',
    '/login',
    '/logout',
    '//x',
    '/x/%E0%A4%A',
    '/apix',
    '/mcpx',
    '/_nextx/y',
    '/favicon.ico/x',
    '/api%2Fusers',
    '/%61pi/users/me',
    '/admin',
    '/admin/collections/blog',
  ])('redirects a cross-site document GET of %s to /', async (pathname) => {
    const res = await build().request(pathname, { headers: crossSiteDocument });
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('/');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('redirects HEAD the same as GET', async () => {
    const res = await build().request('/collections/blog', { method: 'HEAD', headers: crossSiteDocument });
    expect(res.status).toBe(302);
  });

  it('lets the admin root / through', async () => {
    expect((await build().request('/', { headers: crossSiteDocument })).status).toBe(200);
  });

  it.each([
    '/api',
    '/api/users/me',
    '/api/media/file/a.png',
    '/api/media-upload',
    '/mcp',
    '/mcp/x',
    '/.well-known/oauth-protected-resource/mcp',
    '/.well-known/oauth-authorization-server',
    '/cdn-cgi/access/logout',
    '/_next/static/chunks/main.js',
    '/favicon.ico',
  ])('lets the non-admin path %s through', async (pathname) => {
    expect((await build().request(pathname, { headers: crossSiteDocument })).status).toBe(200);
  });

  it.each(['same-origin', 'same-site', 'none'])('lets a %s navigation through', async (site) => {
    const res = await build().request('/collections/blog', { headers: { 'Sec-Fetch-Site': site, 'Sec-Fetch-Dest': 'document' } });
    expect(res.status).toBe(200);
  });

  it('lets a request without fetch metadata through', async () => {
    expect((await build().request('/collections/blog')).status).toBe(200);
  });

  it.each(['iframe', 'image', 'empty'])('lets a cross-site %s request through', async (dest) => {
    const res = await build().request('/collections/blog', { headers: { 'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Dest': dest } });
    expect(res.status).toBe(200);
  });

  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('lets %s through', async (method) => {
    const res = await build().request('/collections/blog', { method, headers: crossSiteDocument });
    expect(res.status).toBe(200);
  });
});
