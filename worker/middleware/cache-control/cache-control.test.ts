import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { cacheControlHeaders, hasUpstreamCacheControl, isOK, isShareable, MEDIA_POLICY, PRIVATE_POLICY, resolveCacheControl, setsCookie, TEXT_FEED_POLICY } from './index';

describe('resolveCacheControl', () => {
  it.each([
    ['/api/media/file/a.jpg', MEDIA_POLICY],
    ['/blog/rss.xml', TEXT_FEED_POLICY],
    ['/gallery/rss.xml', TEXT_FEED_POLICY],
    ['/llms.txt', TEXT_FEED_POLICY],
    ['/llms-full.txt', TEXT_FEED_POLICY],
    ['/blog/my-post.md', TEXT_FEED_POLICY],
    ['/about.md', TEXT_FEED_POLICY],
    ['/.well-known/security.txt', TEXT_FEED_POLICY],
    ['/api/users/me', PRIVATE_POLICY],
    ['/api/news', PRIVATE_POLICY],
    ['/api/mcp', PRIVATE_POLICY],
    ['/api/media/file/x.jpg', MEDIA_POLICY],
  ])('%s → %s', (path, expected) => {
    expect(resolveCacheControl(path)).toBe(expected);
  });

  it.each(['/', '/works', '/contact', '/admin', '/sitemap.xml', '/_next/image'])('leaves %s to the upstream policy', (path) => {
    expect(resolveCacheControl(path)).toBeUndefined();
  });

  // 生の pathname で判定する(percent-decode しない)。
  it.each(['/%61pi/users/me', '/api%2Fmedia/file/a.jpg', '/blog/rss%2Exml'])('does not decode %s', (path) => {
    expect(resolveCacheControl(path)).toBeUndefined();
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
});

describe('cacheControlHeaders', () => {
  const build = (upstream: () => Response) => new Hono().use('*', cacheControlHeaders()).get('*', () => upstream());

  it('adds the policy when the upstream response has none', async () => {
    const app = build(() => new Response('xml'));
    const res = await app.request('/blog/rss.xml');
    expect(res.headers.get('Cache-Control')).toBe(TEXT_FEED_POLICY);
  });

  it('never overrides an existing Cache-Control', async () => {
    const app = build(() => new Response('x', { headers: { 'Cache-Control': 'private, no-store' } }));
    const res = await app.request('/blog/rss.xml');
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('skips responses that set cookies', async () => {
    const app = build(() => new Response('x', { headers: { 'Set-Cookie': 'a=b' } }));
    const res = await app.request('/blog/rss.xml');
    expect(res.headers.get('Cache-Control')).toBeNull();
  });

  it('skips non-200 responses', async () => {
    const app = build(() => new Response('nope', { status: 404 }));
    const res = await app.request('/api/media/file/missing.jpg');
    expect(res.headers.get('Cache-Control')).toBeNull();
  });
});
