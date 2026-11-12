import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { frameGuard, resolveCSP, SAME_ORIGIN_FRAME_ANCESTORS } from './index';

describe('resolveCSP', () => {
  it('uses frame-ancestors alone when there is no upstream CSP', () => {
    expect(resolveCSP(null, SAME_ORIGIN_FRAME_ANCESTORS)).toBe("frame-ancestors 'self'");
  });

  it('uses frame-ancestors alone when the upstream CSP is blank', () => {
    expect(resolveCSP('  ', SAME_ORIGIN_FRAME_ANCESTORS)).toBe("frame-ancestors 'self'");
  });

  it('appends frame-ancestors to an upstream CSP that lacks it', () => {
    expect(resolveCSP("default-src 'self'", SAME_ORIGIN_FRAME_ANCESTORS)).toBe("default-src 'self'; frame-ancestors 'self'");
    expect(resolveCSP("default-src 'self';", SAME_ORIGIN_FRAME_ANCESTORS)).toBe("default-src 'self'; frame-ancestors 'self'");
  });

  it('leaves an upstream CSP that already has frame-ancestors', () => {
    expect(resolveCSP("default-src 'self'; frame-ancestors 'none'", SAME_ORIGIN_FRAME_ANCESTORS)).toBe("default-src 'self'; frame-ancestors 'none'");
  });
});

const build = (upstream: () => Response) => new Hono().use('*', frameGuard()).all('*', upstream);

describe('frameGuard', () => {
  it.each(['/admin', '/admin/collections/blog', '/%61dmin', '/api/users/me', '/'])('allows only same-origin framing of %s', async (pathname) => {
    const res = await build(() => new Response('ok')).request(pathname);
    expect(res.headers.get('Content-Security-Policy')).toBe("frame-ancestors 'self'");
    expect(res.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
  });

  it('merges into an upstream CSP instead of clobbering it', async () => {
    const res = await build(() => new Response('ok', { headers: { 'Content-Security-Policy': "default-src 'self'" } })).request('/admin');
    expect(res.headers.get('Content-Security-Policy')).toBe("default-src 'self'; frame-ancestors 'self'");
  });

  it('keeps the upstream status and body', async () => {
    const res = await build(() => Response.json({ error: 'x' }, { status: 401 })).request('/api/media-upload', { method: 'POST' });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'x' });
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });
});
