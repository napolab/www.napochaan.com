import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { FRAME_ANCESTORS_NONE, frameGuardHeaders, isFrameGuardedPath, resolveCSP, X_FRAME_OPTIONS_DENY } from './frame-guard';

describe('isFrameGuardedPath', () => {
  it.each(['/oauth/authorize', '/oauth/authorize/', '/oauth/authorize/x'])('guards %s', (path) => {
    expect(isFrameGuardedPath(path)).toBe(true);
  });

  it.each(['/', '/admin', '/oauth/authorized', '/oauth/token', '/oauth'])('leaves %s alone', (path) => {
    expect(isFrameGuardedPath(path)).toBe(false);
  });
});

describe('resolveCSP', () => {
  it('uses frame-ancestors alone when there is no upstream CSP', () => {
    expect(resolveCSP(null)).toBe(FRAME_ANCESTORS_NONE);
  });

  it('appends frame-ancestors to an upstream CSP that lacks it', () => {
    expect(resolveCSP("default-src 'self'")).toBe(`default-src 'self'; ${FRAME_ANCESTORS_NONE}`);
    expect(resolveCSP("default-src 'self';")).toBe(`default-src 'self'; ${FRAME_ANCESTORS_NONE}`);
  });

  it('leaves an upstream CSP that already has frame-ancestors', () => {
    expect(resolveCSP("default-src 'self'; frame-ancestors 'self'")).toBe("default-src 'self'; frame-ancestors 'self'");
  });
});

describe('frameGuardHeaders', () => {
  const build = (upstream: () => Response) => new Hono().use('*', frameGuardHeaders()).get('*', () => upstream());

  it('sets CSP and X-Frame-Options on /oauth/authorize', async () => {
    const res = await build(() => new Response('form')).request('/oauth/authorize?x=1');
    expect(res.headers.get('Content-Security-Policy')).toBe(FRAME_ANCESTORS_NONE);
    expect(res.headers.get('X-Frame-Options')).toBe(X_FRAME_OPTIONS_DENY);
  });

  it.each(['/', '/admin'])('does not touch %s', async (path) => {
    const res = await build(() => new Response('x')).request(path);
    expect(res.headers.get('Content-Security-Policy')).toBeNull();
    expect(res.headers.get('X-Frame-Options')).toBeNull();
  });

  it('appends frame-ancestors to an existing CSP without one', async () => {
    const res = await build(() => new Response('x', { headers: { 'Content-Security-Policy': "default-src 'self'" } })).request('/oauth/authorize');
    expect(res.headers.get('Content-Security-Policy')).toBe(`default-src 'self'; ${FRAME_ANCESTORS_NONE}`);
  });

  it('leaves an existing CSP that has frame-ancestors', async () => {
    const res = await build(() => new Response('x', { headers: { 'Content-Security-Policy': "frame-ancestors 'self'" } })).request('/oauth/authorize');
    expect(res.headers.get('Content-Security-Policy')).toBe("frame-ancestors 'self'");
  });
});
