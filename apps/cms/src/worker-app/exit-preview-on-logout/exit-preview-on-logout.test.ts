import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { exitPreviewOnLogout, toExitPreviewLocation } from './index';

const env = { WEB_ORIGIN: 'https://napochaan.com', CMS_ORIGIN: 'https://cms.napochaan.com' };
const EXIT_PREVIEW = 'https://napochaan.com/next/exit-preview?redirect=https%3A%2F%2Fcms.napochaan.com%2Fcdn-cgi%2Faccess%2Flogout';

const accessLogout = () => {
  const headers = new Headers({ Location: '/cdn-cgi/access/logout', 'Cache-Control': 'no-store' });
  headers.append('Set-Cookie', 'payload-token=; Path=/; Max-Age=0');
  headers.append('Set-Cookie', '__prerender_bypass=; Path=/; Max-Age=0');
  return new Response(null, { status: 303, headers });
};

const build = (upstream: () => Response) => new Hono<{ Bindings: typeof env }>().use('*', exitPreviewOnLogout()).all('*', upstream);

describe('toExitPreviewLocation', () => {
  it('routes the Access logout through web exit-preview, back to the cms Access logout', () => {
    expect(toExitPreviewLocation('/cdn-cgi/access/logout', env)).toBe(EXIT_PREVIEW);
  });

  it.each([
    { WEB_ORIGIN: '', CMS_ORIGIN: env.CMS_ORIGIN },
    { WEB_ORIGIN: env.WEB_ORIGIN, CMS_ORIGIN: '' },
    { WEB_ORIGIN: 'not a url', CMS_ORIGIN: env.CMS_ORIGIN },
  ])('returns undefined when an origin is unusable (%o)', (origins) => {
    expect(toExitPreviewLocation('/cdn-cgi/access/logout', origins)).toBeUndefined();
  });
});

describe('exitPreviewOnLogout', () => {
  it('rewrites the Access logout 303 to chain through web exit-preview', async () => {
    const res = await build(accessLogout).request('/api/users/access-logout', { method: 'POST' }, env);

    expect(res.status).toBe(303);
    expect(res.headers.get('Location')).toBe(EXIT_PREVIEW);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('keeps both expired cookies', async () => {
    const res = await build(accessLogout).request('/api/users/access-logout', { method: 'POST' }, env);

    expect(res.headers.getSetCookie()).toEqual(['payload-token=; Path=/; Max-Age=0', '__prerender_bypass=; Path=/; Max-Age=0']);
  });

  it('leaves the cross-site 403 untouched', async () => {
    const res = await build(() => Response.json({ message: 'Cross-site logout requests are not allowed' }, { status: 403 })).request('/api/users/access-logout', { method: 'POST' }, env);

    expect(res.status).toBe(403);
    expect(res.headers.get('Location')).toBeNull();
  });

  it.each([
    ['another redirect', () => new Response(null, { status: 303, headers: { Location: '/' } })],
    ['a 302 to the Access logout', () => new Response(null, { status: 302, headers: { Location: '/cdn-cgi/access/logout' } })],
  ])('leaves %s untouched', async (_label, upstream) => {
    const res = await build(upstream).request('/api/users/access-logout', { method: 'POST' }, env);

    expect(res.headers.get('Location')).not.toBe(EXIT_PREVIEW);
  });

  it('leaves a GET untouched', async () => {
    const res = await build(accessLogout).request('/api/users/access-logout', {}, env);

    expect(res.headers.get('Location')).toBe('/cdn-cgi/access/logout');
  });

  it('falls back to the plain Access logout when WEB_ORIGIN is unset', async () => {
    const res = await build(accessLogout).request('/api/users/access-logout', { method: 'POST' }, { ...env, WEB_ORIGIN: '' });

    expect(res.headers.get('Location')).toBe('/cdn-cgi/access/logout');
  });
});
