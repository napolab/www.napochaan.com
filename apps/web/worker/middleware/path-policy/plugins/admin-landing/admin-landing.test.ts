import { describe, expect, it } from 'vitest';

import { adminLandingPlugin } from './index';

const crossSiteDocument = { 'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Dest': 'document' };

const run = (pathname: string, headers: Headers = new Headers(crossSiteDocument), method = 'GET') => adminLandingPlugin.run({ method, pathname, headers });

describe('adminLandingPlugin', () => {
  it.each(['/admin/collections/blog/1', '/admin/account', '/admin//x', '/admin/%E0%A4%A'])('redirects a cross-site document GET of %s to /admin', (pathname) => {
    expect(run(pathname)._unsafeUnwrap()).toEqual({ kind: 'redirect', location: '/admin' });
  });

  it('redirects HEAD the same as GET', () => {
    expect(run('/admin/collections', new Headers(crossSiteDocument), 'HEAD')._unsafeUnwrap()).toEqual({ kind: 'redirect', location: '/admin' });
  });

  // Access ログイン直後の着地先。ここまで弾くと IdP 経由のログインが成立しない。
  it.each(['/admin', '/admin/'])('lets the admin root %s through', (pathname) => {
    expect(run(pathname).isErr()).toBe(true);
  });

  it.each(['/', '/administrator/x', '/adminx/y', '/api/users/me', '/oauth/authorize'])('ignores non-admin path %s', (pathname) => {
    expect(run(pathname).isErr()).toBe(true);
  });

  it.each(['same-origin', 'same-site', 'none'])('lets a %s navigation through', (site) => {
    expect(run('/admin/collections', new Headers({ 'Sec-Fetch-Site': site, 'Sec-Fetch-Dest': 'document' })).isErr()).toBe(true);
  });

  it('lets a request without fetch metadata through', () => {
    expect(run('/admin/collections', new Headers()).isErr()).toBe(true);
  });

  // 非 document の cross-site は Payload の strategy(csrf)が user を解決しないので、ここでは触らない。
  it.each(['iframe', 'image', 'empty'])('lets a cross-site %s request through', (dest) => {
    expect(run('/admin/collections', new Headers({ 'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Dest': dest })).isErr()).toBe(true);
  });

  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('lets %s through', (method) => {
    expect(run('/admin/collections', new Headers(crossSiteDocument), method).isErr()).toBe(true);
  });

  it('returns the request as the err value on a miss', () => {
    const input = { method: 'GET', pathname: '/', headers: new Headers(crossSiteDocument) };

    expect(adminLandingPlugin.run(input)._unsafeUnwrapErr()).toBe(input);
  });
});
