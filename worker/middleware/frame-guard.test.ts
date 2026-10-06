import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { DENY_FRAMING, frameGuardHeaders, resolveCSP, resolveFramePolicy, SAME_ORIGIN_FRAMING } from './frame-guard';

describe('resolveFramePolicy', () => {
  it.each(['/oauth/authorize', '/oauth/authorize/', '/oauth/authorize/x', '/oauth/%61uthorize', '/oauth/authorize%2Fx'])('denies all framing of %s', (path) => {
    expect(resolveFramePolicy(path)).toEqual(DENY_FRAMING);
  });

  it.each(['/admin', '/admin/', '/admin/collections/blog/1', '/%61dmin', '/admin%2Fcollections'])('allows only same-origin framing of %s', (path) => {
    expect(resolveFramePolicy(path)).toEqual(SAME_ORIGIN_FRAMING);
  });

  it.each(['/', '/administrator', '/adminx', '/oauth/authorized', '/oauth/authorizeX', '/oauth/token', '/oauth', '/api/users/me', '/next/preview'])('leaves %s alone', (path) => {
    expect(resolveFramePolicy(path)).toBeUndefined();
  });
});

describe('resolveFramePolicy with malformed percent-encoding', () => {
  it('does not throw and does not guard an unrelated malformed path', () => {
    expect(() => resolveFramePolicy('/x/%E0%A4%A')).not.toThrow();
    expect(resolveFramePolicy('/x/%E0%A4%A')).toBeUndefined();
  });

  it('still guards a malformed path whose raw pathname matches', () => {
    expect(resolveFramePolicy('/oauth/authorize/%E0%A4%A')).toEqual(DENY_FRAMING);
    expect(resolveFramePolicy('/admin/%E0%A4%A')).toEqual(SAME_ORIGIN_FRAMING);
  });
});

describe('resolveCSP', () => {
  it('uses frame-ancestors alone when there is no upstream CSP', () => {
    expect(resolveCSP(null, DENY_FRAMING.frameAncestors)).toBe("frame-ancestors 'none'");
    expect(resolveCSP(null, SAME_ORIGIN_FRAMING.frameAncestors)).toBe("frame-ancestors 'self'");
  });

  it('appends frame-ancestors to an upstream CSP that lacks it', () => {
    expect(resolveCSP("default-src 'self'", DENY_FRAMING.frameAncestors)).toBe("default-src 'self'; frame-ancestors 'none'");
    expect(resolveCSP("default-src 'self';", SAME_ORIGIN_FRAMING.frameAncestors)).toBe("default-src 'self'; frame-ancestors 'self'");
  });

  it('leaves an upstream CSP that already has frame-ancestors', () => {
    expect(resolveCSP("default-src 'self'; frame-ancestors 'self'", DENY_FRAMING.frameAncestors)).toBe("default-src 'self'; frame-ancestors 'self'");
  });
});

describe('frameGuardHeaders', () => {
  const build = (upstream: () => Response) => new Hono().use('*', frameGuardHeaders()).get('*', () => upstream());

  it('denies framing of /oauth/authorize', async () => {
    const res = await build(() => new Response('form')).request('/oauth/authorize?x=1');
    expect(res.headers.get('Content-Security-Policy')).toBe("frame-ancestors 'none'");
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it.each(['/admin', '/admin/collections/blog/1', '/%61dmin'])('allows only same-origin framing of %s', async (path) => {
    const res = await build(() => new Response('admin')).request(path);
    expect(res.headers.get('Content-Security-Policy')).toBe("frame-ancestors 'self'");
    expect(res.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
  });

  it.each(['/', '/administrator'])('does not touch %s', async (path) => {
    const res = await build(() => new Response('x')).request(path);
    expect(res.headers.get('Content-Security-Policy')).toBeNull();
    expect(res.headers.get('X-Frame-Options')).toBeNull();
  });

  it('appends frame-ancestors to an existing CSP without one', async () => {
    const res = await build(() => new Response('x', { headers: { 'Content-Security-Policy': "default-src 'self'" } })).request('/oauth/authorize');
    expect(res.headers.get('Content-Security-Policy')).toBe("default-src 'self'; frame-ancestors 'none'");
  });

  it('leaves an existing CSP that has frame-ancestors', async () => {
    const res = await build(() => new Response('x', { headers: { 'Content-Security-Policy': "frame-ancestors 'self'" } })).request('/oauth/authorize');
    expect(res.headers.get('Content-Security-Policy')).toBe("frame-ancestors 'self'");
  });
});
