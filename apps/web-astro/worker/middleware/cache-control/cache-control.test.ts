import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { PAGE_CACHE_POLICIES } from '../../../src/utils/cache-control';
import { cacheControlHeaders, hasUpstreamCacheControl, isOK, isPageCacheable, isShareable, resolveCacheControl, setsCookie } from './index';
import { MEDIA_POLICY } from './policies';

import type { CMSHealthVariables } from '../../lib/cms-health';

// What Next.js emits for a `force-dynamic` page (next/dist/server/lib/cache-control.js).
const NEXT_DYNAMIC_POLICY = 'private, no-cache, no-store, max-age=0, must-revalidate';

describe('resolveCacheControl', () => {
  it.each([
    ['/api/media/file/a.jpg', { kind: 'fill', policy: MEDIA_POLICY }],
    ['/api/health', { kind: 'deny', policy: PAGE_CACHE_POLICIES.uncacheable }],
    ['/_next/image', { kind: 'keep' }],
    ['/_astro/client.JLSpUPyv.js', { kind: 'keep' }],
    ['/_image', { kind: 'keep' }],
    ['/_actions/contact.send', { kind: 'deny', policy: PAGE_CACHE_POLICIES.uncacheable }],
    ['/_server-islands/Island', { kind: 'deny', policy: PAGE_CACHE_POLICIES.uncacheable }],
    ['/blog/preview/1', { kind: 'deny', policy: PAGE_CACHE_POLICIES.uncacheable }],
    ['/news/preview/1', { kind: 'deny', policy: PAGE_CACHE_POLICIES.uncacheable }],
    ['/works/preview/1', { kind: 'deny', policy: PAGE_CACHE_POLICIES.uncacheable }],
    ['/gallery/preview', { kind: 'deny', policy: PAGE_CACHE_POLICIES.uncacheable }],
    ['/log/preview', { kind: 'deny', policy: PAGE_CACHE_POLICIES.uncacheable }],
    ['/next/preview', { kind: 'deny', policy: PAGE_CACHE_POLICIES.uncacheable }],
    ['/next/exit-preview', { kind: 'deny', policy: PAGE_CACHE_POLICIES.uncacheable }],
    ['/', { kind: 'page', policy: PAGE_CACHE_POLICIES.timeSensitive }],
    ['/log', { kind: 'page', policy: PAGE_CACHE_POLICIES.timeSensitive }],
    ['/log.md', { kind: 'page', policy: PAGE_CACHE_POLICIES.timeSensitive }],
    ['/log/rss.xml', { kind: 'page', policy: PAGE_CACHE_POLICIES.timeSensitive }],
    ['/blog/a', { kind: 'page', policy: PAGE_CACHE_POLICIES.cms }],
    ['/blog/page/2', { kind: 'page', policy: PAGE_CACHE_POLICIES.cms }],
    ['/blog/a/opengraph-image-1a2b3c', { kind: 'page', policy: PAGE_CACHE_POLICIES.cms }],
    ['/works', { kind: 'page', policy: PAGE_CACHE_POLICIES.cms }],
    ['/contact', { kind: 'page', policy: PAGE_CACHE_POLICIES.cms }],
    ['/blog/rss.xml', { kind: 'page', policy: PAGE_CACHE_POLICIES.cms }],
    ['/blog/a.md', { kind: 'page', policy: PAGE_CACHE_POLICIES.cms }],
    ['/llms.txt', { kind: 'page', policy: PAGE_CACHE_POLICIES.cms }],
    ['/llms-full.txt', { kind: 'page', policy: PAGE_CACHE_POLICIES.cms }],
    ['/sitemap.xml', { kind: 'page', policy: PAGE_CACHE_POLICIES.cms }],
    ['/robots.txt', { kind: 'page', policy: PAGE_CACHE_POLICIES.cms }],
    ['/.well-known/security.txt', { kind: 'page', policy: PAGE_CACHE_POLICIES.timeSensitive }],
  ])('%s → %o', (path, expected) => {
    expect(resolveCacheControl(path)).toEqual(expected);
  });

  // media は Workers Cache のキーと同じ生の pathname で判定する(decode しない)。
  // encode された path は media を外れ、後段の api plugin(decode 判定)で no-store になる。
  it('matches media on the raw pathname only', () => {
    expect(resolveCacheControl('/api/media/%66ile/a.jpg')).toEqual({ kind: 'deny', policy: PAGE_CACHE_POLICIES.uncacheable });
  });

  // Next は percent-encoded path を同じ route に解決する。no-store / time-sensitive の判定は
  // decode 後でも当たるようにして、encode で public な cms policy にすり抜けさせない。
  it.each([
    ['/blog/%70review/1', { kind: 'deny', policy: PAGE_CACHE_POLICIES.uncacheable }],
    ['/%6Eext/preview', { kind: 'deny', policy: PAGE_CACHE_POLICIES.uncacheable }],
    ['/%6Cog', { kind: 'page', policy: PAGE_CACHE_POLICIES.timeSensitive }],
  ])('classifies encoded %s by its decoded route', (path, expected) => {
    expect(resolveCacheControl(path)).toEqual(expected);
  });
});

describe('response predicates', () => {
  it('isOK holds only for 200', () => {
    expect(isOK(new Response('x'))).toBe(true);
    expect(isOK(new Response('x', { status: 201 }))).toBe(false);
    expect(isOK(new Response('x', { status: 404 }))).toBe(false);
  });

  it('hasUpstreamCacheControl holds when Cache-Control is set', () => {
    expect(hasUpstreamCacheControl(new Response('x', { headers: { 'Cache-Control': 'no-store' } }))).toBe(true);
    expect(hasUpstreamCacheControl(new Response('x'))).toBe(false);
  });

  it('setsCookie holds when Set-Cookie is set', () => {
    expect(setsCookie(new Response('x', { headers: { 'Set-Cookie': 'a=b' } }))).toBe(true);
    expect(setsCookie(new Response('x'))).toBe(false);
  });

  it('isShareable holds only for a bare 200', () => {
    expect(isShareable(new Response('x'))).toBe(true);
    expect(isShareable(new Response('x', { status: 404 }))).toBe(false);
    expect(isShareable(new Response('x', { headers: { 'Cache-Control': 'no-store' } }))).toBe(false);
    expect(isShareable(new Response('x', { headers: { 'Set-Cookie': 'a=b' } }))).toBe(false);
  });

  it('isPageCacheable holds for a cookie-less 200 regardless of upstream Cache-Control', () => {
    expect(isPageCacheable(new Response('x'))).toBe(true);
    expect(isPageCacheable(new Response('x', { headers: { 'Cache-Control': NEXT_DYNAMIC_POLICY } }))).toBe(true);
    expect(isPageCacheable(new Response('x', { status: 404 }))).toBe(false);
    expect(isPageCacheable(new Response('x', { headers: { 'Set-Cookie': 'a=b' } }))).toBe(false);
  });
});

describe('cacheControlHeaders', () => {
  const build = (upstream: () => Response, cmsDegraded?: boolean) =>
    new Hono<{ Variables: CMSHealthVariables }>()
      .use('*', cacheControlHeaders())
      .use('*', async (c, next) => {
        if (cmsDegraded !== undefined) c.set('cmsDegraded', cmsDegraded);
        await next();
      })
      .get('*', () => upstream())
      .post('*', () => upstream());

  // A page rendered while the cms Worker was failing must not be stored at the edge.
  it.each(['/blog/a', '/', '/blog/rss.xml'])('forces no-store on %s when the CMS was degraded', async (path) => {
    const app = build(() => new Response('html', { headers: { 'Cache-Control': NEXT_DYNAMIC_POLICY } }), true);
    const res = await app.request(path);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('keeps the cms policy on a healthy 200', async () => {
    const app = build(() => new Response('html', { headers: { 'Cache-Control': NEXT_DYNAMIC_POLICY } }), false);
    const res = await app.request('/blog/a');
    expect(res.headers.get('Cache-Control')).toBe(PAGE_CACHE_POLICIES.cms);
  });

  it('replaces the Next dynamic policy with the cms policy on a CMS page', async () => {
    const app = build(() => new Response('html', { headers: { 'Cache-Control': NEXT_DYNAMIC_POLICY } }));
    const res = await app.request('/blog/a');
    expect(res.headers.get('Cache-Control')).toBe(PAGE_CACHE_POLICIES.cms);
  });

  it('replaces the Next dynamic policy with the time-sensitive policy on home', async () => {
    const app = build(() => new Response('html', { headers: { 'Cache-Control': NEXT_DYNAMIC_POLICY } }));
    const res = await app.request('/');
    expect(res.headers.get('Cache-Control')).toBe(PAGE_CACHE_POLICIES.timeSensitive);
  });

  // /log renders external RSS posts and flips `upcoming` against now: no CMS purge
  // refreshes it, so the page, its markdown twin and its feed take the short policy.
  it.each([
    ['/log', 'text/html; charset=utf-8'],
    ['/log.md', 'text/markdown; charset=utf-8'],
    ['/log/rss.xml', 'application/rss+xml; charset=utf-8'],
  ])('stamps the time-sensitive policy on %s', async (path, contentType) => {
    const app = build(() => new Response('body', { headers: { 'Content-Type': contentType } }));
    const res = await app.request(path);
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=0, s-maxage=3600');
  });

  it('stamps the cms policy on a header-less feed', async () => {
    const app = build(() => new Response('<rss/>'));
    const res = await app.request('/blog/rss.xml');
    expect(res.headers.get('Cache-Control')).toBe(PAGE_CACHE_POLICIES.cms);
  });

  it.each(['/blog/preview/1', '/next/preview'])('forces no-store on %s', async (path) => {
    const app = build(() => new Response('draft', { headers: { 'Cache-Control': NEXT_DYNAMIC_POLICY } }));
    const res = await app.request(path);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('forces no-store even on a redirect that sets the draft cookie', async () => {
    const app = build(() => new Response(null, { status: 307, headers: { Location: '/blog/preview/1', 'Set-Cookie': '__prerender_bypass=x' } }));
    const res = await app.request('/next/preview');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(res.headers.get('Set-Cookie')).toBe('__prerender_bypass=x');
  });

  it('leaves non-GET page responses (Server Actions) alone', async () => {
    const app = build(() => new Response('action', { headers: { 'Cache-Control': NEXT_DYNAMIC_POLICY } }));
    const res = await app.request('/contact', { method: 'POST' });
    expect(res.headers.get('Cache-Control')).toBe(NEXT_DYNAMIC_POLICY);
  });

  it('leaves a page response that sets cookies alone', async () => {
    const app = build(() => new Response('x', { headers: { 'Set-Cookie': 'a=b', 'Cache-Control': NEXT_DYNAMIC_POLICY } }));
    const res = await app.request('/blog/a');
    expect(res.headers.get('Cache-Control')).toBe(NEXT_DYNAMIC_POLICY);
  });

  it('leaves a non-200 page response alone', async () => {
    const app = build(() => new Response('missing', { status: 404, headers: { 'Cache-Control': NEXT_DYNAMIC_POLICY } }));
    const res = await app.request('/blog/missing');
    expect(res.headers.get('Cache-Control')).toBe(NEXT_DYNAMIC_POLICY);
  });

  it('keeps the policy /_next/* routes set themselves', async () => {
    const app = build(() => new Response('img', { headers: { 'Cache-Control': MEDIA_POLICY } }));
    const res = await app.request('/_next/image?url=/a.jpg&w=640&q=75');
    expect(res.headers.get('Cache-Control')).toBe(MEDIA_POLICY);
  });

  it('fills the media policy only when upstream has none', async () => {
    const bare = await build(() => new Response('img')).request('/api/media/file/a.jpg');
    expect(bare.headers.get('Cache-Control')).toBe(MEDIA_POLICY);
    const set = await build(() => new Response('img', { headers: { 'Cache-Control': 'private, no-store' } })).request('/api/media/file/a.jpg');
    expect(set.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('skips non-200 media responses', async () => {
    const app = build(() => new Response('nope', { status: 404 }));
    const res = await app.request('/api/media/file/missing.jpg');
    expect(res.headers.get('Cache-Control')).toBeNull();
  });
});
